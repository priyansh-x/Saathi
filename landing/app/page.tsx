import { Answer } from "@/components/answer";
import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { Hero } from "@/components/hero";
import { Listen } from "@/components/listen";
import { Problem } from "@/components/problem";
import { Connect, Faq, Finale, HerWay } from "@/components/rest";
import { Safety } from "@/components/safety";
import { Setup } from "@/components/setup";
import { Why } from "@/components/why";

export default function Home() {
  return (
    <>
      <SkipLink />
      <SiteEffects />
      <Nav />
      <main id="main">
        <Hero />
        <Listen />
        <Problem />
        <Answer />
        <Why />
        <Safety />
        <Setup />
        <HerWay />
        <Connect />
        <Faq />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
