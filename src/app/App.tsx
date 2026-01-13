import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { UploadPage } from './components/UploadPage';
import { MobileUploadPage } from './components/MobileUploadPage';
import { ReviewFoodsPage } from './components/ReviewFoodsPage';
import { LoadingPage } from './components/LoadingPage';
import { ResultsPage } from './components/ResultsPage';
import { PricingPage } from './components/PricingPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { FAQPage } from './components/FAQPage';
import { SignInPage } from './components/SignInPage';
import { SignUpPage } from './components/SignUpPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { AccountPage } from './components/AccountPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsOfServicePage } from './components/TermsOfServicePage';
import { InventoryPage } from './components/InventoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F9FAF7]">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/mobile-upload" element={<MobileUploadPage />} />
          <Route path="/review" element={<ReviewFoodsPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
