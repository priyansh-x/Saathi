import { Answer } from "@/components/answer";
import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { Desk } from "@/components/desk";
import { Hero } from "@/components/hero";
import { Listen } from "@/components/listen";
import { People } from "@/components/people";
import { Faq, Finale } from "@/components/rest";
import { Safety } from "@/components/safety";
import { Setup } from "@/components/setup";
import { Bet, Privacy } from "@/components/thesis";
import { Why } from "@/components/why";
import { exampleDeskUrl, familyDeskUrl } from "@/lib/desk";

export default function Home() {
  const desk = familyDeskUrl();
  const example = exampleDeskUrl();
  return (
    <>
      <SkipLink />
      <SiteEffects />
      <Nav deskUrl={desk} />
      <main id="main">
        <Hero deskUrl={desk} />
        <Listen />
        <Answer />
        <People />
        <Safety />
        <Desk exampleUrl={example} />
        <Setup />
        <Why />
        <Bet />
        <Privacy />
        <Faq />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
