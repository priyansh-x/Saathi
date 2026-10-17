import { Answer } from "@/components/answer";
import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { Hero } from "@/components/hero";
import { Listen } from "@/components/listen";
import { Problem } from "@/components/problem";
import { Faq, Finale, HerWay } from "@/components/rest";
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
        <Setup />
        <HerWay />
        <Faq />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
