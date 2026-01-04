import {onRequest} from "firebase-functions/https";
import twilio from "twilio";
import querystring from "querystring";
import {getFirestore} from "firebase-admin/firestore";

export const twilioMessageWebhook = onRequest(
  {region: "europe-west1"},
  async (request, response) => {
    if (request.method === "POST") {
      const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
      const header = request.headers["x-twilio-signature"] as string;

      const hookURL = `${process.env.TWILIO_MESSAGE_WEBHOOK_URL}`;
      const rawBody = request.rawBody?.toString();
      const params = querystring.parse(rawBody);

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

      const db = getFirestore();

      try {
        const twiml = new twilio.twiml.MessagingResponse();

        const {
          Body: incomingMessage,
          To: calledNumber,
          From: callerId,
        } = request.body;
        console.log("incomingMessage", request.body);

        const setAddressMsg =
          "Din adresse er modtaget! " +
          "Du vil få leveret din mad om ca. 20-40 minutter.";
        const alreadySetAddressMsg =
          "Du har allerede sendt din adresse. " +
          "Leveringstiden er 20-40 minutter.";

        const doc = await db
          .collection("users")
          .doc(calledNumber)
          .collection("customers")
          .doc(callerId)
          .get();

        if (doc.exists) {
          const data = doc.data();
          const status = data?.status;
          const address = data?.address;

          if (status === "ongoing") {
            if (!address) {
              await db
                .collection("users")
                .doc(calledNumber)
                .collection("customers")
                .doc(callerId)
                .set({
                  ...data,
                  address: incomingMessage,
                });
              twiml.message(setAddressMsg);
            } else {
              twiml.message(alreadySetAddressMsg);
            }
          }
        }

        response.status(200).send(twiml.toString());
      } catch (error) {
        console.error("Error sending message", error);
        response.status(500).send("Internal server error");
      }
    }
  }
);
