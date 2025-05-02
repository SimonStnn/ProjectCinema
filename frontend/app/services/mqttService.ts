import mqtt, { type MqttClient } from "mqtt";
import { create } from "zustand";
// import { useAuthStore } from "../store/authStore";

// Environment variables would be better for production
const MQTT_BROKER_URL =
  (import.meta as any).env?.VITE_MQTT_BROKER_URL || "ws://localhost:9001"; // Traefik will route this
const BASE_TOPIC = "cinema";

// MQTT client instance
let client: MqttClient | null = null;

// Seat update message interface
interface SeatUpdate {
  showingId: string;
  seatId: string;
  status: string;
  timestamp: number;
}

// Booking request interface
interface BookingRequest {
  userId: string;
  showingId: string;
  seats: string[];
}

// State management with Zustand
interface MqttState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  seatUpdates: SeatUpdate[];
  bookingSuccess: boolean | null;
  bookingError: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: string | null) => void;
  addSeatUpdate: (update: SeatUpdate) => void;
  clearSeatUpdates: () => void;
  setBookingStatus: (success: boolean, error?: string) => void;
  clearBookingStatus: () => void;
}

export const useMqttStore = create<MqttState>((set) => ({
  connected: false,
  connecting: false,
  error: null,
  seatUpdates: [],
  bookingSuccess: null,
  bookingError: null,

  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setError: (error) => set({ error }),
  addSeatUpdate: (update) =>
    set((state) => ({
      seatUpdates: [...state.seatUpdates, update],
    })),
  clearSeatUpdates: () => set({ seatUpdates: [] }),
  setBookingStatus: (success, error = undefined) =>
    set({
      bookingSuccess: success,
      bookingError: error,
    }),
  clearBookingStatus: () =>
    set({
      bookingSuccess: null,
      bookingError: null,
    }),
}));

// Initialize MQTT connection - using both function names for compatibility
export const initializeMqtt = (userId?: string): Promise<void> => {
  return initializeMqttClient(userId);
};

// Initialize MQTT connection - original function
export const initializeMqttClient = (userId?: string): Promise<void> => {
  const { setConnected, setConnecting, setError } = useMqttStore.getState();

  return new Promise((resolve, reject) => {
    if (client && client.connected) {
      resolve();
      return;
    }

    setConnecting(true);

    try {
      client = mqtt.connect(MQTT_BROKER_URL, {
        clientId: `cinema-user-${userId || "anonymous"}-${Date.now()}`,
        clean: true,
        reconnectPeriod: 3000,
        connectTimeout: 10000,
      });

      client.on("connect", () => {
        console.log("Connected to MQTT broker");
        setConnected(true);
        setConnecting(false);
        setError(null);
        resolve();
      });

      client.on("error", (err: Error) => {
        console.error("MQTT connection error:", err);
        setError(`MQTT connection error: ${err.message}`);
        setConnecting(false);
        reject(err);
      });

      client.on("offline", () => {
        console.log("MQTT client is offline");
        setConnected(false);
      });

      client.on("message", (topic, message) => {
        handleIncomingMessage(topic, message);
      });
    } catch (err) {
      console.error("MQTT initialization failed:", err);
      setError(`MQTT initialization failed: ${(err as any).message}`);
      setConnecting(false);
      reject(err);
    }
  });
};

// Close MQTT connection
export const closeMqttConnection = (): void => {
  if (client && client.connected) {
    client.end();
    useMqttStore.getState().setConnected(false);
    console.log("MQTT connection closed");
  }
};

// Subscribe to showing-specific seat updates
export const subscribeToShowing = (showingId: string): void => {
  if (!client || !client.connected) {
    console.error("MQTT client not connected when trying to subscribe");
    return;
  }

  const topic = `${BASE_TOPIC}/showings/${showingId}/seats`;
  client.subscribe(topic, (err) => {
    if (err) {
      console.error(`Error subscribing to ${topic}:`, err);
    } else {
      console.log(`Subscribed to ${topic}`);
    }
  });
};

// Unsubscribe from showing updates
export const unsubscribeFromShowing = (showingId: string): void => {
  if (!client || !client.connected) return;

  const topic = `${BASE_TOPIC}/showings/${showingId}/seats`;
  client.unsubscribe(topic);
  console.log(`Unsubscribed from ${topic}`);
};

// Send booking request
export const sendBookingRequest = (booking: BookingRequest): void => {
  if (!client || !client.connected) {
    console.error("MQTT client not connected when trying to send booking");
    useMqttStore
      .getState()
      .setBookingStatus(false, "Not connected to booking service");
    return;
  }

  const topic = `${BASE_TOPIC}/bookings/request`;
  const payload = JSON.stringify({
    ...booking,
    requestId: `req-${Date.now()}`,
    timestamp: Date.now(),
  });

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error("Error publishing booking request:", err);
      useMqttStore
        .getState()
        .setBookingStatus(false, `Failed to send booking: ${err.message}`);
    } else {
      console.log("Booking request sent");

      // Subscribe to response topic
      const responseTopic = `${BASE_TOPIC}/bookings/response/${booking.userId}`;
      client && client.subscribe(responseTopic);
    }
  });
};

// Handle incoming MQTT messages
const handleIncomingMessage = (topic: string, message: Buffer): void => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`Received message on ${topic}:`, payload);

    // Handle seat updates
    if (topic.includes("/seats")) {
      const { addSeatUpdate } = useMqttStore.getState();
      addSeatUpdate(payload as SeatUpdate);
    }

    // Handle booking responses
    if (topic.includes("/bookings/response/")) {
      const { success, error } = payload;
      useMqttStore.getState().setBookingStatus(success, error);
    }
  } catch (err) {
    console.error("Error processing MQTT message:", err);
  }
};

// Helper method to send seat selection status
export const publishSeatSelection = (
  showingId: string,
  seatId: string,
  selected: boolean
): void => {
  if (!client || !client.connected) return;

  const topic = `${BASE_TOPIC}/showings/${showingId}/seat-selections`;
  const payload = JSON.stringify({
    seatId,
    status: selected ? "selected" : "available",
    timestamp: Date.now(),
  });

  client.publish(topic, payload);
};
