import {onRequest} from "firebase-functions/https";
import twilio from "twilio";
import querystring from "querystring";

export const twilioCallWebhook = onRequest(
  {region: "europe-west1"},
  async (request, response) => {
    if (request.method === "POST") {
      const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
      const rawBody = request.rawBody?.toString();
      const params = querystring.parse(rawBody);

      const header = request.headers["x-twilio-signature"] as string;
      const hookURL = `${process.env.TWILIO_CALL_WEBHOOK_URL}`;

      const isValid = twilio.validateRequest(
        authToken,
        header,
        hookURL,
        params
      );

      if (!isValid) {
        response.status(401).send("Unauthorized");
        return;
      }

      const callStatus = request.body.CallStatus;
      const ForwardedFrom = request.body.ForwardedFrom;

      // Only handle "queued" status - end call if ForwardedFrom is missing
      if (callStatus === "ringing") {
        if (!ForwardedFrom) {
          response
            .status(200)
            .send(
              "<Response><Say language='da-DK' voice='Naja'>" +
                "Undskyld,opkaldet er" +
                "desværre ikke gyldigt." +
                " Prøv et andet nummer.</Say></Response>"
            );
        }
      }
    }
  }
);
