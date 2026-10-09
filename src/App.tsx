import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ThemeProvider } from './theme';
import { LanguageProvider } from './i18n/LanguageProvider';
import { DemoProvider } from './components/demo/DemoProvider';

export default function App() {
  return (
    <LanguageProvider><ThemeProvider>
      <BrowserRouter><DemoProvider>
        <AppRoutes />
      </DemoProvider></BrowserRouter>
    </ThemeProvider></LanguageProvider>
  );
}
