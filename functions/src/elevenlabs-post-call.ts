import crypto from "crypto";
import {getFirestore} from "firebase-admin/firestore";
import {onRequest} from "firebase-functions/https";
import twilio from "twilio";

export const elevenlabsPostCallWebhook = onRequest(
  {region: "europe-west1"},
  async (request, response) => {
    if (request.method === "POST") {
      const accountSid = `${process.env.TWILIO_ACCOUNT_SID}`;
      const authToken = `${process.env.TWILIO_AUTH_TOKEN}`;
      const secret = `${process.env.ELEVENLABS_POST_SECRET}`;

      const headers = request.headers["elevenlabs-signature"]
        ?.toString()
        .split(",");
      const timestamp = headers?.find((e) => e.startsWith("t="))?.substring(2);
      const signature = headers?.find((e) => e.startsWith("v0="));
      const reqTimestamp = timestamp ? parseInt(timestamp) * 1000 : 0;
      const tolerance = Date.now() - 30 * 60 * 1000;

      if (reqTimestamp < tolerance) {
        response.status(403).send("Request expired");
        return;
      } else {
        const rawBody = request.rawBody;
        if (!rawBody) {
          response.status(400).send("Missing request body");
          return;
        }

        const bodyString = rawBody.toString();

        const message = `${timestamp}.${bodyString}`;

        const digestHash = crypto
          .createHmac("sha256", secret)
          .update(message)
          .digest("hex");
        const digest = "v0=" + digestHash;

        if (signature !== digest) {
          response.status(401).send("Request unauthorized");
          return;
        }
      }

      const db = getFirestore();
      const twilioClient = twilio(accountSid, authToken);

      try {
        const convSummary =
          request.body.data?.analysis?.data_collection_results?.summary_da
            ?.value;

        const confirmOrder =
          request.body.data?.analysis?.data_collection_results?.confirm_order
            ?.value;

        const {
          system__call_sid: callSid,
          system__called_number: calledNumber,
          system__caller_id: callerId,
        } = request.body.data?.conversation_initiation_client_data
          ?.dynamic_variables ?? {};

        if (!callSid) {
          console.error("Missing callSid");
          response.status(400).send("Missing call sid");
          return;
        }
        if (!convSummary) {
          console.error("Missing convSummary");
          response.status(400).send("Missing conversation summary");
          return;
        }
        const convSummaryParsed = convSummary
          .replace(/\\u00e6/g, "æ")
          .replace(/\\u00f8/g, "ø")
          .replace(/\\u00e5/g, "å");

        // confirmOrder can also be null or undefined. Not just No.
        if (confirmOrder === "Yes") {
          const newOrderMsg =
            "Hej! Vi har modtaget din ordre. " +
            "Hvis du vil have at vi leverer ordren til dig, " +
            "kan du indtaste din adresse her. " +
            "Ellers kan du ignorere denne besked, " +
            "og afhente din ordre om 10-20 minutter. " +
            "Mange tak på forhånd!";

          const doc = await db
            .collection("users")
            .doc(calledNumber)
            .collection("customers")
            .doc(callerId)
            .get();

          const address = doc.data()?.address;

          await db
            .collection("users")
            .doc(calledNumber)
            .collection("customers")
            .doc(callerId)
            .set({
              conv_summary: convSummaryParsed,
              call_sid: callSid,
              called_number: calledNumber,
              caller_id: callerId,
              timestamp: Math.floor(new Date().getTime() / 1000),
              status: "ongoing",
            });

          if (!address) {
            await twilioClient.messages.create({
              from: calledNumber,
              to: callerId,
              body: newOrderMsg,
            });
          }

          response.status(200).send("OK");
          return;
        }
        console.log("Customer did not confirm order");
        response.status(200).send("OK");
      } catch (error) {
        console.error("Error saving conversation", error);
        response.status(500).send("Internal server error");
      }
    }
  }
);
