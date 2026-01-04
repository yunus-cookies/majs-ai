import {getFirestore} from "firebase-admin/firestore";
import {onRequest} from "firebase-functions/https";

export const elevenlabsInitCallWebhook = onRequest(
  {region: "europe-west1"},
  async (request, response) => {
    if (request.method === "POST") {
      const secret = request.headers["x-elevenlabs-init-signature"]?.toString();

      if (secret !== `${process.env.TWILIO_AUTH_TOKEN}`) {
        response.status(401).send("Request unauthorized");
        return;
      }

      const db = getFirestore();

      try {
        const {caller_id: callerId, called_number: calledNumber} = request.body;
        const doc = await db
          .collection("users")
          .doc(calledNumber)
          .collection("customers")
          .doc(callerId)
          .get();

        const convSummary = doc.data()?.conv_summary || "";

        const convInitData = {
          type: "conversation_initiation_client_data",
          dynamic_variables: {
            user_name: "Gemello la pizza",
            conv_summary: convSummary,
          },
        };

        response.status(200).send(convInitData);
      } catch (error) {
        console.error("Error saving conversation", error);
        response.status(500).send("Internal server error");
      }
    }
  }
);
