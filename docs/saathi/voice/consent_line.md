# First-call consent line (DRAFT)

Status: **DRAFT**. Companionship only — never diagnosis. Keep the 112 line on every real call.

Saathi asks this on the first live morning call, after the child has already given written yes. Nothing from the conversation is stored as a summary, quote, or transcript until she answers.

**Hindi (spoken):**  
«{{address_term}}, मैं साथी हूँ। {{child_name}} ने मुझे रोज़ आपको फ़ोन करने के लिए रखा है — थोड़ी बात, दवा की याद। क्या रोज़ सुबह फ़ोन करूँ? हाँ या नहीं बोलिए। आपात में 112 मिलाइए।»

**English (spoken):**  
"{{address_term}}, this is Saathi. {{child_name}} asked me to call you each morning — a short chat and a medicine reminder. May I call every morning? Please say yes or no. In an emergency, call 112."

If she says **yes**: record `answer=yes`, set `consent_status=given`, keep calling.  
If she says **no**: record `answer=no`, set `consent_status=declined`, pause the household, tell the child, never store her words as a quote.  
If she does not answer: leave `pending`. No summary, quote, or transcript is kept.
