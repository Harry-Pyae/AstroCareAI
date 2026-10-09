import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ThemeProvider } from './theme';
import { LanguageProvider } from './i18n/LanguageProvider';
import { DemoProvider } from './components/demo/DemoProvider';
import { DemoGuideProvider } from './components/demo/DemoGuide';

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <DemoProvider>
          <DemoGuideProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </DemoGuideProvider>
        </DemoProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
