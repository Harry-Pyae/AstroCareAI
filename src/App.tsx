import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { ThemeProvider } from './theme';
import { LanguageProvider } from './i18n/LanguageProvider';

export default function App() {
  return (
    <LanguageProvider><ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider></LanguageProvider>
  );
}
