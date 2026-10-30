import { Answer } from "@/components/answer";
import { Footer, Nav, SiteEffects, SkipLink } from "@/components/chrome";
import { Hero } from "@/components/hero";
import { Listen } from "@/components/listen";
import { People } from "@/components/people";
import { Faq, Finale } from "@/components/rest";
import { Safety } from "@/components/safety";
import { Setup } from "@/components/setup";
import { Privacy, ThesisBand } from "@/components/thesis";
import { Tour } from "@/components/tour";
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
        <Tour exampleUrl={example} />
        <People />
        <Answer />
        <Safety />
        <Setup />
        <ThesisBand />
        <Privacy />
        <Faq />
        <Finale />
      </main>
      <Footer />
    </>
  );
}
