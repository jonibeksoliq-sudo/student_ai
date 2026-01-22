
import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { LoadingView } from './components/LoadingView';
import { SlideViewer } from './components/SlideViewer';
import { generatePresentationPlan, generateSlideImage } from './services/geminiService';
import { AppStatus, Slide, GenerationProgress, Theme, Language } from './types';
import { getTheme } from './utils/themes';
import { translations } from './utils/translations';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [topic, setTopic] = useState<string>('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [theme, setTheme] = useState<Theme>(getTheme('modern_blue'));
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [progress, setProgress] = useState<GenerationProgress>({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('uz');

  const handleGenerate = async (inputTopic: string, slideCount: number, planCount: number, selectedLang: Language, additionalInfo?: string) => {
    setTopic(inputTopic);
    setStatus(AppStatus.GENERATING_PLAN);
    setError(null);
    setSlides([]);
    setBackgroundImage(null);

    try {
      // 1. Reja va mavzuni aniqlash
      const planResponse = await generatePresentationPlan(inputTopic, slideCount, planCount, selectedLang, additionalInfo);
      setTheme(getTheme(planResponse.themeId));
      setSlides(planResponse.slides);
      
      // 2. Orqa fon rasmini yaratish (agar prompt bo'lsa)
      if (planResponse.backgroundVisualPrompt) {
        const bg = await generateSlideImage(planResponse.backgroundVisualPrompt, true);
        if (bg) setBackgroundImage(bg);
      }

      // 3. Slayd rasmlarini aniqlash va yaratish
      const slidesToImage = planResponse.slides.filter(s => s.imagePrompt && s.imagePrompt.length > 5);
      const totalImages = slidesToImage.length;
      
      if (totalImages > 0) {
        setStatus(AppStatus.GENERATING_IMAGES);
        setProgress({ current: 0, total: totalImages });

        const updatedSlides = [...planResponse.slides];
        let imagesCompleted = 0;
        
        // Har bir slayd uchun rasm generatsiyasi
        for (let i = 0; i < updatedSlides.length; i++) {
          if (updatedSlides[i].imagePrompt && updatedSlides[i].imagePrompt!.length > 5) {
            try {
              const imageData = await generateSlideImage(updatedSlides[i].imagePrompt!);
              if (imageData) updatedSlides[i].imageData = imageData;
              
              imagesCompleted++;
              setProgress(prev => ({ ...prev, current: imagesCompleted }));
              // UI yangilanishi uchun state yangilanadi
              setSlides([...updatedSlides]);
            } catch (e) {
              console.warn("Rasm yaratishda xatolik:", e);
              // Bitta rasm o'xshamasa ham jarayon to'xtamasligi kerak
            }
          }
        }
      }

      setStatus(AppStatus.READY);

    } catch (err: any) {
      console.error(err);
      setError(translations[language].errorTitle);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRestart = () => {
    setStatus(AppStatus.IDLE);
    setSlides([]);
    setBackgroundImage(null);
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans transition-all duration-500 overflow-hidden">
      
      <header className="bg-white border-b border-slate-200 py-3 px-4 md:px-6 flex items-center justify-between z-50 shadow-sm sticky top-0">
         <div className="flex items-center gap-2 font-bold text-lg text-indigo-600">
            <div className="bg-indigo-600 text-white rounded-lg w-7 h-7 flex items-center justify-center text-sm shrink-0">AI</div>
            <span className="truncate">{t.headerTitle}</span>
         </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-2 md:p-4 relative w-full">
        {status === AppStatus.IDLE && (
          <InputForm 
            onGenerate={handleGenerate} 
            isProcessing={false} 
            onLanguageChange={setLanguage}
            currentLang={language}
          />
        )}
        {(status === AppStatus.GENERATING_PLAN || status === AppStatus.GENERATING_IMAGES) && (
          <LoadingView status={status} progress={progress} language={language} />
        )}
        {status === AppStatus.READY && (
          <SlideViewer 
            slides={slides} 
            topic={topic} 
            theme={theme}
            backgroundImages={backgroundImage ? [backgroundImage] : []}
            usageStats={null}
            onRestart={handleRestart} 
            language={language}
          />
        )}
        {status === AppStatus.ERROR && (
          <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-lg text-center border border-red-100 mx-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-6 font-medium">{error}</p>
            <button 
              onClick={handleRestart} 
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg w-full md:w-auto"
            >
              {t.btnRetry}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
