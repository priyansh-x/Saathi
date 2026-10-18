# First-call consent line (DRAFT)

Status: **DRAFT**. Priyansh approves before any real call. Companionship only — never diagnosis. Keep the 112 line on every real call.

Saathi asks this on the first live morning call, after the child has already given written yes. Nothing from the conversation is stored as a summary, quote, or transcript until she answers.

Pick the **with neighbour** pair only when a neighbour exists and has opted in. Otherwise pick the **without neighbour** pair. Do not strip the neighbour sentence from the with-neighbour text — that sentence also tells her a short update goes to her child.

## With neighbour

**Hindi (spoken, with neighbour):**  
«नमस्ते {parent_name} जी, मैं साथी हूँ। {child_name} ने मुझसे कहा है कि मैं रोज़ सुबह आपसे थोड़ी बात करूँ। ये बातचीत रिकॉर्ड होती है। इसका छोटा सा हाल {child_name} को भेजा जाता है, और ज़रूरत पड़ने पर {neighbour_name} को भी बताया जाता है। आप कभी भी 'बंद करो' कहकर मना कर सकते हैं। किसी इमरजेंसी में हमेशा 112 पर फ़ोन करें। क्या मैं रोज़ सुबह आपको फ़ोन कर सकती हूँ?»

**English (spoken, with neighbour):**  
"Namaste {parent_name} ji, I'm Saathi. {child_name} asked me to call you each morning for a short chat. These calls are recorded. A short update goes to {child_name}, and if something seems wrong, {neighbour_name} is told too. You can say 'stop' anytime. In an emergency, always call 112. May I call you every morning?"

## Without neighbour

**Hindi (spoken, without neighbour):**  
«नमस्ते {parent_name} जी, मैं साथी हूँ। {child_name} ने मुझसे कहा है कि मैं रोज़ सुबह आपसे थोड़ी बात करूँ। ये बातचीत रिकॉर्ड होती है, और इसका छोटा सा हाल {child_name} को भेजा जाता है। आप कभी भी 'बंद करो' कहकर मना कर सकते हैं। किसी इमरजेंसी में हमेशा 112 पर फ़ोन करें। क्या मैं रोज़ सुबह आपको फ़ोन कर सकती हूँ?»

**English (spoken, without neighbour):**  
"Namaste {parent_name} ji, I'm Saathi. {child_name} asked me to call you each morning for a short chat. These calls are recorded, and a short update goes to {child_name}. You can say 'stop' anytime. In an emergency, always call 112. May I call you every morning?"

If she says **yes**: record `answer=yes`, set `consent_status=given`, keep calling.  
If she says **no**: record `answer=no`, set `consent_status=declined`, pause the household, tell the child, never store her words as a quote.  
If she does not answer: leave `pending`. No summary, quote, or transcript is kept.
