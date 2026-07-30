import React from "react";
import { Header } from "./components/Header";
import { ConverterPanel } from "./components/ConverterPanel";
import { Footer } from "./components/Footer";

const App: React.FC = () => (
  <div className="app-shell">
    <Header />
    <main id="main-content" className="app-main">
      <ConverterPanel />
    </main>
    <Footer />
  </div>
);

export default App;
