import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { Desk } from "@/components/desk";
import { Hero } from "@/components/hero";
import { Listen } from "@/components/listen";
import { People } from "@/components/people";
import { Faq, Finale } from "@/components/rest";
import { Safety } from "@/components/safety";
import { Bet, Privacy, WhyNow } from "@/components/thesis";
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
        <People />
        <Safety />
        <Desk exampleUrl={example} />
        <WhyNow />
        <Bet />
        <Privacy />
        <Faq />
        <Finale deskUrl={desk} />
      </main>
      <Footer />
    </>
  );
}
