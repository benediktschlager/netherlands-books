import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

/**
  * Erstellen Sie eine Bewertung, um das Risiko einer UI-Aktion zu analysieren.
  *
  * projectID: Ihre Google Cloud-Projekt-ID.
  * recaptchaSiteKey: Der reCAPTCHA-Schlüssel, der mit der Website/Anwendung verknüpft ist
  * token: Das vom Client erhaltene generierte Token.
  * recaptchaAction: Aktionsname, der dem Token entspricht.
  */
async function createAssessment({
  // AUFGABE: Ersetzen Sie die Token- und reCAPTCHA-Aktionsvariablen, bevor Sie das Beispiel ausführen.
  projectID = "",
  recaptchaKey = "",
  token = "",
  recaptchaAction = "",
}) {
  // Erstellen Sie den reCAPTCHA-Client.
  // AUFGABE: Speichern Sie den Clientgenerierungscode im Cache (empfohlen) oder rufen Sie „client.close()“ auf, bevor Sie die Methode verlassen.
  const client = new RecaptchaEnterpriseServiceClient();
  const projectPath = client.projectPath(projectID);

  // Erstellen Sie die Bewertungsanfrage.
  const request = ({
    assessment: {
      event: {
        token: token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  });

  const [ response ] = await client.createAssessment(request);

  // Prüfen Sie, ob das Token gültig ist.
  if (!response.tokenProperties.valid) {
    console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
    return null;
  }

  // Prüfen Sie, ob die erwartete Aktion ausgeführt wurde.
  // The `action` property is set by user client in the grecaptcha.enterprise.execute() method.
  if (response.tokenProperties.action === recaptchaAction) {
    // Rufen Sie den Risikowert und den oder die Gründe ab.
    // Weitere Informationen zum Interpretieren der Bewertung finden Sie hier:
    // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
    console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
    response.riskAnalysis.reasons.forEach((reason) => {
      console.log(reason);
    });

    return response.riskAnalysis.score;
  } else {
    console.log("The action attribute in your reCAPTCHA tag does not match the action you are expecting to score");
    return null;
  }
}


