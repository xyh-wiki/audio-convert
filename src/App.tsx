import React from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { ConverterPanel } from "./components/ConverterPanel";
import { SupportedFormats } from "./components/SupportedFormats";
import { HowItWorks } from "./components/HowItWorks";
import { UseCases } from "./components/UseCases";
import { FAQ } from "./components/FAQ";
import { About } from "./components/About";
import { Footer } from "./components/Footer";

const App: React.FC = () => (
  <>
    <Header />
    <main>
      <Hero />
      <ConverterPanel />
      <SupportedFormats />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <About />
    </main>
    <Footer />
  </>
);

export default App;
