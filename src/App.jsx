/*
 * App.jsx — The landing page: one scroll, top to bottom.
 */

import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Projects from "./components/Projects.jsx";
import Experience from "./components/Experience.jsx";
import Awards from "./components/Awards.jsx";
import Skills from "./components/Skills.jsx";
import Contact from "./components/Contact.jsx";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Projects />
        <Experience />
        <Awards />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
