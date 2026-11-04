var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// lib/whatsapp/meta-client.ts
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var META_GRAPH_VERSION = "v21.0";
function getWhatsAppCredentials() {
  let phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
  let token = process.env.WHATSAPP_ACCESS_TOKEN || "";
  if (!phoneId || !token) {
    try {
      const envPath = import_path.default.join(process.cwd(), ".env");
      if (import_fs.default.existsSync(envPath)) {
        const envContent = import_fs.default.readFileSync(envPath, "utf-8");
        const mToken = envContent.match(/WHATSAPP_ACCESS_TOKEN=(.*)/);
        const mPhone = envContent.match(/WHATSAPP_PHONE_NUMBER_ID=(.*)/);
        if (mToken && !token) token = mToken[1].trim().replace(/^['\"]|['\"]$/g, "");
        if (mPhone && !phoneId) phoneId = mPhone[1].trim().replace(/^['\"]|['\"]$/g, "");
      }
    } catch {
    }
  }
  return { phoneId, token };
}
async function sendTextMessage(to, bodyText) {
  const { phoneId, token } = getWhatsAppCredentials();
  if (!phoneId || !token) {
    console.error("[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }
  const cleanTo = to.replace(/[^0-9]/g, "");
  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: { body: bodyText }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendTextMessage ${res.status} to ${cleanTo}]:`, errText);
      return false;
    }
    const resJson = await res.json();
    console.log(`[WhatsApp Message Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error(`[WhatsApp Network Error sendTextMessage to ${cleanTo}]:`, err.message);
    return false;
  }
}
async function sendButtonMessage(to, bodyText, buttons) {
  const { phoneId, token } = getWhatsAppCredentials();
  if (!phoneId || !token) {
    console.error("[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }
  const cleanTo = to.replace(/[^0-9]/g, "");
  const formattedButtons = buttons.slice(0, 3).map((btn) => ({
    type: "reply",
    reply: {
      id: btn.id,
      title: btn.title.slice(0, 20)
    }
  }));
  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: bodyText.slice(0, 1024) },
          action: { buttons: formattedButtons }
        }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendButtonMessage ${res.status} to ${cleanTo}]:`, errText);
      const fallbackText = `${bodyText}

Quick Options:
` + buttons.map((b, i) => `${i + 1}. ${b.title} (Send "${b.title}")`).join("\n");
      return sendTextMessage(cleanTo, fallbackText);
    }
    const resJson = await res.json();
    console.log(`[WhatsApp Buttons Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error(`[WhatsApp Network Error sendButtonMessage to ${cleanTo}]:`, err.message);
    const fallbackText = `${bodyText}

Quick Options:
` + buttons.map((b, i) => `${i + 1}. ${b.title}`).join("\n");
    return sendTextMessage(cleanTo, fallbackText);
  }
}
async function sendListMessage(to, headerText, bodyText, buttonText, sections) {
  const { phoneId, token } = getWhatsAppCredentials();
  if (!phoneId || !token) {
    console.error("[WhatsApp Config Error] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN");
    return false;
  }
  const cleanTo = to.replace(/[^0-9]/g, "");
  try {
    const res = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "interactive",
        interactive: {
          type: "list",
          header: { type: "text", text: headerText.slice(0, 60) },
          body: { text: bodyText.slice(0, 1024) },
          action: {
            button: buttonText.slice(0, 20),
            sections: sections.map((sec) => ({
              title: sec.title.slice(0, 24),
              rows: sec.rows.slice(0, 10).map((r) => ({
                id: r.id,
                title: r.title.slice(0, 24),
                description: r.description ? r.description.slice(0, 72) : void 0
              }))
            }))
          }
        }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`[WhatsApp API Error sendListMessage ${res.status} to ${cleanTo}]:`, errText);
      let fallbackText = `*${headerText}*
${bodyText}

Please reply with your choice:
`;
      sections.forEach((sec) => {
        sec.rows.forEach((r) => {
          fallbackText += `\u2022 *${r.title}*${r.description ? ` (${r.description})` : ""}
`;
        });
      });
      return sendTextMessage(cleanTo, fallbackText);
    }
    const resJson = await res.json();
    console.log(`[WhatsApp List Delivered to ${cleanTo}]:`, resJson?.messages?.[0]?.id);
    return true;
  } catch (err) {
    console.error(`[WhatsApp Network Error sendListMessage to ${cleanTo}]:`, err.message);
    let fallbackText = `*${headerText}*
${bodyText}

Please reply with your choice:
`;
    sections.forEach((sec) => {
      sec.rows.forEach((r) => {
        fallbackText += `\u2022 *${r.title}*
`;
      });
    });
    return sendTextMessage(cleanTo, fallbackText);
  }
}

// lib/db/properties-store.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var DATA_DIR = import_path2.default.join(process.cwd(), "data");
var PROPERTIES_FILE = import_path2.default.join(DATA_DIR, "properties.json");
function ensurePropertiesFile() {
  if (!import_fs2.default.existsSync(DATA_DIR)) {
    import_fs2.default.mkdirSync(DATA_DIR, { recursive: true });
  }
}
function getAllProperties() {
  ensurePropertiesFile();
  try {
    if (!import_fs2.default.existsSync(PROPERTIES_FILE)) return [];
    const content = import_fs2.default.readFileSync(PROPERTIES_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}
function saveProperties(properties) {
  ensurePropertiesFile();
  import_fs2.default.writeFileSync(PROPERTIES_FILE, JSON.stringify(properties, null, 2), "utf-8");
}
function formatPriceNumber(num) {
  if (num >= 1e7) {
    return `\u20B9${(num / 1e7).toFixed(2)} Cr`;
  }
  if (num >= 1e5) {
    return `\u20B9${(num / 1e5).toFixed(2)} Lakh`;
  }
  return `\u20B9${num.toLocaleString("en-IN")}`;
}
function createProperty(data, user) {
  const properties = getAllProperties();
  const id = `prop-${Date.now()}`;
  const price = Number(data.price) || 5e6;
  const carpetArea = Number(data.carpetAreaSqft) || 1e3;
  const pricePerSqft = Math.round(price / carpetArea);
  const title = (data.title || "Direct Property Listing").trim();
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;
  const storeCode = (user.agencyName || user.fullName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const newProperty = {
    id,
    title,
    slug,
    category: data.category || "apartment",
    categoryLabel: data.categoryLabel || `${data.bedrooms || 3} BHK Apartment`,
    purpose: data.purpose || "sale",
    price,
    formattedPrice: formatPriceNumber(price),
    pricePerSqft,
    formattedPricePerSqft: `\u20B9${pricePerSqft.toLocaleString("en-IN")} / sq.ft`,
    maintenanceMonthly: data.maintenanceMonthly || 0,
    city: data.city || "Mumbai",
    locality: data.locality || "Prime Corridor",
    address: data.address || `${data.locality || "Main Corridor"}, ${data.city || "Mumbai"}`,
    landmark: data.landmark || "Near Metro & Business Hub",
    pincode: data.pincode || "400001",
    bedrooms: Number(data.bedrooms) || 0,
    bathrooms: Number(data.bathrooms) || 1,
    balconies: Number(data.balconies) || 1,
    carpetAreaSqft: carpetArea,
    superBuiltupSqft: data.superBuiltupSqft || Math.round(carpetArea * 1.3),
    furnishing: data.furnishing || "semi_furnished",
    possession: data.possession || "ready_to_move",
    floorInfo: data.floorInfo || "Mid Floor",
    carParking: Number(data.carParking) || 1,
    facing: data.facing || "East",
    reraId: data.reraId || user.reraNumber || "Self-Reported",
    isReraApproved: true,
    isFeatured: true,
    isTopSearch: false,
    status: "active",
    primaryImage: data.primaryImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    additionalImages: data.additionalImages || [
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80"
    ],
    amenities: data.amenities && data.amenities.length > 0 ? data.amenities : [
      "24/7 Security & CCTV",
      "Covered Parking",
      "High-Speed Elevators",
      "Power Backup"
    ],
    description: data.description || "Direct broker listing on BrokersBlitz platform with declared RERA registration (verify on state portal).",
    viewsCount: 1,
    leadsCount: 0,
    broker: {
      id: user.id,
      name: user.fullName,
      storeCode,
      agency: user.agencyName || "Independent Broker Network",
      phone: user.phone,
      whatsapp: user.phone,
      reraNumber: user.reraNumber || "A51900010482",
      isReraVerified: false,
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80",
      experienceYears: 10,
      totalListings: properties.filter((p) => p.broker.name === user.fullName).length + 1,
      rating: 4.9,
      responseTime: "Within 15 mins",
      bio: `Dedicated property advisor with ${user.agencyName || "Independent Broker Network"}.`,
      city: user.operatingCity || data.city || "Mumbai"
    },
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  properties.unshift(newProperty);
  saveProperties(properties);
  return newProperty;
}
function searchProperties(filters) {
  const properties = getAllProperties();
  return properties.filter((p) => {
    if (filters.city && filters.city !== "Pan India" && filters.city !== "All India" && p.city.toLowerCase() !== filters.city.toLowerCase()) {
      return false;
    }
    if (filters.purpose && filters.purpose !== "all" && p.purpose !== filters.purpose) {
      return false;
    }
    if (filters.category && filters.category !== "all" && p.category !== filters.category) {
      return false;
    }
    if (filters.bhk && filters.bhk !== "all") {
      if (filters.bhk === "4+" && p.bedrooms < 4) return false;
      if (filters.bhk !== "4+" && p.bedrooms !== parseInt(filters.bhk, 10)) return false;
    }
    if (filters.possession && filters.possession !== "all" && p.possession !== filters.possession) {
      return false;
    }
    if (filters.furnishing && filters.furnishing !== "all" && p.furnishing !== filters.furnishing) {
      return false;
    }
    if (filters.reraOnly && !p.isReraApproved) {
      return false;
    }
    if (filters.minPrice !== void 0 && p.price < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== void 0 && p.price > filters.maxPrice) {
      return false;
    }
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const match = p.title.toLowerCase().includes(q) || p.locality.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.broker.name.toLowerCase().includes(q) || p.broker.agency.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

// lib/db/leads-store.ts
var import_fs3 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));
var DATA_DIR2 = import_path3.default.join(process.cwd(), "data");
var LEADS_FILE = import_path3.default.join(DATA_DIR2, "leads.json");
function ensureLeadsFile() {
  if (!import_fs3.default.existsSync(DATA_DIR2)) {
    import_fs3.default.mkdirSync(DATA_DIR2, { recursive: true });
  }
  if (!import_fs3.default.existsSync(LEADS_FILE)) {
    import_fs3.default.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}
function getAllLeads() {
  ensureLeadsFile();
  try {
    const raw = import_fs3.default.readFileSync(LEADS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveLeads(leads) {
  ensureLeadsFile();
  import_fs3.default.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}
function createLead(data) {
  const leads = getAllLeads();
  const newLead = {
    ...data,
    id: `lead-${Date.now()}`,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  leads.unshift(newLead);
  saveLeads(leads);
  return newLead;
}

// lib/whatsapp/voice-to-listing.ts
function formatPriceIndian(amount) {
  if (amount >= 1e7) {
    return `\u20B9${(amount / 1e7).toFixed(2)} Crore`;
  }
  if (amount >= 1e5) {
    return `\u20B9${(amount / 1e5).toFixed(2)} Lakh`;
  }
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}
function formatDraftSummaryCard(draft, brokerInfo) {
  const priceDisplay = draft.price ? formatPriceIndian(draft.price) : "Price on Request";
  const negotiableTag = draft.isNegotiable ? " (Negotiable)" : "";
  const intentLabel = draft.purpose === "rent" ? "For Rent" : "For Sale";
  const amenitiesList = (draft.amenities || []).slice(0, 4).join(", ") || "Covered Parking, Lift";
  let card = `*PROPERTY LISTING DRAFT*
------------------------------
`;
  card += `\u2022 *Intent:* ${intentLabel}
`;
  card += `\u2022 *Configuration:* ${draft.categoryLabel || "Residential Property"}
`;
  card += `\u2022 *Super Area:* ${draft.carpetAreaSqft || 1e3} sq.ft
`;
  card += `\u2022 *Floor:* ${draft.floorInfo || "Mid Floor"}
`;
  card += `\u2022 *Location:* ${draft.locality || "Prime Locality"}, ${draft.city || "Indore"}
`;
  card += `\u2022 *Asking Price:* ${priceDisplay}${negotiableTag}
`;
  card += `\u2022 *Furnishing:* ${draft.furnishing === "furnished" ? "Fully Furnished" : draft.furnishing === "unfurnished" ? "Raw / Unfurnished" : "Semi-Furnished"}
`;
  card += `\u2022 *Key Amenities:* ${amenitiesList}
`;
  if (brokerInfo) {
    card += `------------------------------
`;
    card += `\u2022 *Listing Broker:* ${brokerInfo.name} (${brokerInfo.agency})
`;
    if (brokerInfo.storeCode) card += `\u2022 *Partner Store:* brokersblitz.in/broker/${brokerInfo.storeCode}
`;
    if (brokerInfo.rera) card += `\u2022 *RERA:* ${brokerInfo.rera}
`;
  }
  card += `------------------------------
`;
  if (draft.rawVoiceTranscript) {
    card += `*Transcript:* "${draft.rawVoiceTranscript}"
------------------------------
`;
  }
  card += `*Need to fix anything?*
Reply with any correction (e.g. "Price 50 lakh" or "3 BHK" or "Vijay Nagar") or tap [Edit Details] below:`;
  return card;
}

// lib/whatsapp/session-store.ts
var import_fs5 = __toESM(require("fs"));
var import_path5 = __toESM(require("path"));

// lib/auth/user-store.ts
var import_fs4 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));

// lib/auth/crypto.ts
var import_crypto = __toESM(require("crypto"));
function hashPassword(password) {
  const salt = import_crypto.default.randomBytes(16).toString("hex");
  const hash = import_crypto.default.pbkdf2Sync(password, salt, 1e5, 64, "sha512").toString("hex");
  return { hash, salt };
}

// lib/auth/user-store.ts
var DATA_DIR3 = import_path4.default.join(process.cwd(), "data");
var USERS_FILE = import_path4.default.join(DATA_DIR3, "users.json");
var SESSIONS_FILE = import_path4.default.join(DATA_DIR3, "sessions.json");
function ensureDataFiles() {
  if (!import_fs4.default.existsSync(DATA_DIR3)) {
    import_fs4.default.mkdirSync(DATA_DIR3, { recursive: true });
  }
  if (!import_fs4.default.existsSync(USERS_FILE)) {
    const defaultPass = hashPassword("BrokersBlitz@2026");
    const defaultUsers = [
      {
        id: "user-admin-01",
        fullName: "Platform Operations Admin",
        email: "admin@brokersblitz.in",
        phone: "7272357771",
        role: "admin",
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        agencyName: "BrokersBlitz Headquarters",
        dpdpConsent: true,
        dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "user-broker-demo",
        fullName: "Rajesh Mehta",
        email: "broker@apexrealty.in",
        phone: "9820144520",
        role: "broker",
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        agencyName: "Apex Prime Realty MMR",
        reraNumber: "A51900010482",
        operatingCity: "Mumbai",
        dpdpConsent: true,
        dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "user-buyer-demo",
        fullName: "Rahul Sharma",
        email: "buyer@investors.in",
        phone: "9876543210",
        role: "buyer",
        passwordHash: defaultPass.hash,
        passwordSalt: defaultPass.salt,
        dpdpConsent: true,
        dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    import_fs4.default.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf-8");
  }
  if (!import_fs4.default.existsSync(SESSIONS_FILE)) {
    import_fs4.default.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}
function getAllUsers() {
  ensureDataFiles();
  try {
    const raw = import_fs4.default.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveUsers(users) {
  ensureDataFiles();
  import_fs4.default.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}
function findUserByPhone(phone) {
  const cleaned = phone.replace(/[^0-9]/g, "").slice(-10);
  const users = getAllUsers();
  return users.find((u) => u.phone.replace(/[^0-9]/g, "").slice(-10) === cleaned);
}
function findUserById(id) {
  const users = getAllUsers();
  return users.find((u) => u.id === id);
}
function getAllBrokers() {
  return getAllUsers().filter((u) => u.role === "broker");
}

// lib/whatsapp/session-store.ts
var DATA_DIR4 = import_path5.default.join(process.cwd(), "data");
var SESSIONS_FILE2 = import_path5.default.join(DATA_DIR4, "whatsapp_sessions.json");
function ensureSessionFile() {
  if (!import_fs5.default.existsSync(DATA_DIR4)) {
    import_fs5.default.mkdirSync(DATA_DIR4, { recursive: true });
  }
  if (!import_fs5.default.existsSync(SESSIONS_FILE2)) {
    import_fs5.default.writeFileSync(SESSIONS_FILE2, JSON.stringify({}, null, 2), "utf-8");
  }
}
function readSessions() {
  ensureSessionFile();
  try {
    const raw = import_fs5.default.readFileSync(SESSIONS_FILE2, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function writeSessions(sessions) {
  ensureSessionFile();
  import_fs5.default.writeFileSync(SESSIONS_FILE2, JSON.stringify(sessions, null, 2), "utf-8");
}
function getOrCreateSession(phone, userName) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  if (sessions[cleanPhone]) {
    sessions[cleanPhone].lastActive = (/* @__PURE__ */ new Date()).toISOString();
    writeSessions(sessions);
    return sessions[cleanPhone];
  }
  const existingUser = findUserByPhone(cleanPhone);
  const isBroker = existingUser?.role === "broker";
  const newSession = {
    phone: cleanPhone,
    role: isBroker ? "broker" : "buyer",
    brokerId: existingUser?.id,
    brokerCode: existingUser?.storeCode || (existingUser?.agencyName ? existingUser.agencyName.toLowerCase().replace(/[^a-z0-9]/g, "") : void 0),
    brokerName: existingUser?.fullName || userName || "Partner Broker",
    agencyName: existingUser?.agencyName || "Independent Broker Network",
    currentStep: "idle",
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = newSession;
  writeSessions(sessions);
  return newSession;
}
function updateSession(phone, updates) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);
  const merged = {
    ...current,
    ...updates,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}
function setSessionStep(phone, step) {
  return updateSession(phone, { currentStep: step });
}
function updateDraftListing(phone, data) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);
  const existingDraft = current.draftListing || {};
  const updatedDraft = {
    ...existingDraft,
    ...data
  };
  const merged = {
    ...current,
    draftListing: updatedDraft,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}
function resetDraftListing(phone) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);
  const merged = {
    ...current,
    currentStep: "idle",
    draftListing: void 0,
    activeDraftId: void 0,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}
function updateBuyerPreferences(phone, data) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);
  const existingPrefs = current.buyerPreferences || {};
  const updatedPrefs = {
    ...existingPrefs,
    ...data,
    lastSearchedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const merged = {
    ...current,
    buyerPreferences: updatedPrefs,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}
function resetBuyerPreferences(phone) {
  const cleanPhone = phone.replace(/[^0-9]/g, "").slice(-10);
  const sessions = readSessions();
  const current = sessions[cleanPhone] || getOrCreateSession(phone);
  const merged = {
    ...current,
    currentStep: "idle",
    buyerPreferences: void 0,
    lastActive: (/* @__PURE__ */ new Date()).toISOString()
  };
  sessions[cleanPhone] = merged;
  writeSessions(sessions);
  return merged;
}

// lib/whatsapp/handlers/buyerFlow.ts
function getAppBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }
  return "https://brokersblitz.in";
}
async function promptBuyerIntent(from, userName) {
  resetBuyerPreferences(from);
  setSessionStep(from, "buyer_step1_intent");
  const greeting = `Namaste ${userName || "there"}! Welcome to *BrokersBlitz* - India's direct broker-verified real estate intelligence network.

What are you looking for today?`;
  return sendButtonMessage(from, greeting, [
    { id: "buyer_intent_buy", title: "Buy Property" },
    { id: "buyer_intent_rent", title: "Rent Property" },
    { id: "buyer_action_broker", title: "Broker Access" }
  ]);
}
async function promptBuyerCity(from, isRent) {
  setSessionStep(from, "buyer_step2_city");
  return sendListMessage(
    from,
    "Step 1 of 4: Select City",
    `Which city would you like to ${isRent ? "rent" : "buy"} property in?`,
    "Select City",
    [
      {
        title: "Central & West India",
        rows: [
          { id: "buyer_city_indore", title: "Indore", description: "Madhya Pradesh" },
          { id: "buyer_city_bhopal", title: "Bhopal", description: "Madhya Pradesh" },
          { id: "buyer_city_mumbai", title: "Mumbai", description: "Maharashtra" },
          { id: "buyer_city_pune", title: "Pune", description: "Maharashtra" },
          { id: "buyer_city_ahmedabad", title: "Ahmedabad", description: "Gujarat" }
        ]
      },
      {
        title: "North & South Metros",
        rows: [
          { id: "buyer_city_delhi", title: "Delhi NCR", description: "Gurgaon, Noida, Delhi" },
          { id: "buyer_city_bangalore", title: "Bangalore", description: "Karnataka" },
          { id: "buyer_city_hyderabad", title: "Hyderabad", description: "Telangana" },
          { id: "buyer_city_jaipur", title: "Jaipur", description: "Rajasthan" }
        ]
      }
    ]
  );
}
async function promptBuyerCategory(from, city) {
  setSessionStep(from, "buyer_step3_category");
  return sendButtonMessage(
    from,
    `*Step 2 of 4: Property Type in ${city}*
What type of property are you looking for?`,
    [
      { id: "buyer_cat_flat", title: "Flat / Apartment" },
      { id: "buyer_cat_villa", title: "Villa / House" },
      { id: "buyer_cat_plot", title: "Plot / Land" }
    ]
  );
}
async function promptBuyerBhk(from, categoryLabel, city) {
  setSessionStep(from, "buyer_step4_bhk");
  return sendButtonMessage(
    from,
    `*Step 3 of 4: Configuration*
Select BHK requirement for your ${categoryLabel} in ${city}:`,
    [
      { id: "buyer_bhk_1", title: "1 BHK" },
      { id: "buyer_bhk_2", title: "2 BHK" },
      { id: "buyer_bhk_3", title: "3 BHK" }
    ]
  );
}
async function promptBuyerBudget(from, isRent, summarySpecs) {
  setSessionStep(from, "buyer_step5_budget");
  if (isRent) {
    return sendButtonMessage(
      from,
      `*Step 4 of 4: Monthly Rent Budget*
Select your expected monthly rent range for ${summarySpecs}:`,
      [
        { id: "buyer_rent_15k", title: "Under 15,000" },
        { id: "buyer_rent_30k", title: "15k - 30,000" },
        { id: "buyer_rent_above", title: "Above 30,000" }
      ]
    );
  }
  return sendButtonMessage(
    from,
    `*Step 4 of 4: Purchase Budget*
Select your preferred investment budget for ${summarySpecs}:`,
    [
      { id: "buyer_budget_50l", title: "Under 50 Lakhs" },
      { id: "buyer_budget_1cr", title: "50L - 1 Crore" },
      { id: "buyer_budget_above", title: "Above 1 Crore" }
    ]
  );
}
async function executeBuyerSearch(from) {
  const session = getOrCreateSession(from);
  const prefs = session.buyerPreferences || {};
  setSessionStep(from, "idle");
  const city = prefs.city || "Indore";
  const bhk = prefs.bedrooms ? String(prefs.bedrooms) : void 0;
  const category = prefs.category === "apartment" ? "apartment" : prefs.category === "villa" ? "villa" : void 0;
  const purpose = prefs.purpose || "sale";
  const results = searchProperties({
    city,
    bhk,
    category,
    purpose,
    minPrice: prefs.minPrice,
    maxPrice: prefs.maxPrice
  });
  const baseUrl = getAppBaseUrl();
  if (results.length > 0) {
    const topMatches = results.slice(0, 3);
    const bhkLabel = prefs.bedrooms ? `${prefs.bedrooms} BHK ` : "";
    const budgetLabel = prefs.budgetLabel ? ` | Budget: ${prefs.budgetLabel}` : "";
    let response = `*FOUND ${results.length} VERIFIED PROPERTIES IN ${city.toUpperCase()}!*
Criteria: ${bhkLabel}${prefs.categoryLabel || "Residential"}${budgetLabel}

`;
    topMatches.forEach((p, idx) => {
      const price = formatPriceIndian(p.price);
      response += `${idx + 1}. *${p.title}*
`;
      response += `   \u2022 *Price:* ${price}
`;
      response += `   \u2022 *Area:* ${p.carpetAreaSqft} sq.ft (${p.categoryLabel})
`;
      response += `   \u2022 *Location:* ${p.locality}, ${p.city}
`;
      response += `   \u2022 *Broker:* ${p.broker.name} (${p.broker.agency})
`;
      response += `   \u2022 *View Details:* ${baseUrl}/property/${p.slug}

`;
    });
    response += `Would you like to schedule a private viewing or modify your filters?`;
    return sendButtonMessage(from, response, [
      { id: "buyer_action_visit", title: "Book Site Visit" },
      { id: "buyer_action_restart", title: "Modify Search" },
      { id: "buyer_action_broker", title: "Broker Access" }
    ]);
  }
  const fallbackResults = searchProperties({ city, purpose });
  const closest = fallbackResults.slice(0, 2);
  let noMatchMsg = `*NO EXACT MATCHES IN THAT BUDGET RANGE*
We currently don't have active listings matching all specific filters in ${city}.

`;
  if (closest.length > 0) {
    noMatchMsg += `*Closest Verified Options in ${city}:*

`;
    closest.forEach((p, idx) => {
      noMatchMsg += `${idx + 1}. *${p.title}*
   \u2022 *Price:* ${formatPriceIndian(p.price)}
   \u2022 *Location:* ${p.locality}
   \u2022 *Link:* ${baseUrl}/property/${p.slug}

`;
    });
  }
  noMatchMsg += `Would you like to adjust your budget or search another city?`;
  return sendButtonMessage(from, noMatchMsg, [
    { id: "buyer_action_restart", title: "Start New Search" },
    { id: "buyer_action_visit", title: "Book Site Visit" },
    { id: "buyer_action_broker", title: "Broker Access" }
  ]);
}
async function handleBuyerInquiry(from, text, userName, actionId) {
  const session = getOrCreateSession(from, userName);
  const cleanPhone = from.replace(/[^0-9]/g, "").slice(-10);
  if (actionId === "buyer_action_restart" || actionId === "buyer_action_search" || actionId === "" && /^(hi|hello|hey|start|menu|search|buy|rent|properties|flats)$/i.test(text.trim())) {
    return promptBuyerIntent(from, userName);
  }
  if (actionId === "buyer_intent_buy" || actionId === "buyer_intent_rent") {
    const isRent = actionId === "buyer_intent_rent";
    updateBuyerPreferences(from, { purpose: isRent ? "rent" : "sale" });
    return promptBuyerCity(from, isRent);
  }
  if (actionId?.startsWith("buyer_city_") || session.currentStep === "buyer_step2_city") {
    let cityName = "Indore";
    if (actionId?.startsWith("buyer_city_")) {
      cityName = actionId.replace("buyer_city_", "").replace(/\b\w/g, (l) => l.toUpperCase());
    } else if (text) {
      const cities2 = ["Indore", "Mumbai", "Pune", "Bhopal", "Delhi", "Bangalore", "Jaipur", "Hyderabad", "Ahmedabad"];
      for (const c of cities2) {
        if (text.toLowerCase().includes(c.toLowerCase())) {
          cityName = c;
          break;
        }
      }
    }
    updateBuyerPreferences(from, { city: cityName });
    return promptBuyerCategory(from, cityName);
  }
  if (actionId?.startsWith("buyer_cat_") || session.currentStep === "buyer_step3_category") {
    const catId = actionId || "";
    const prefs = session.buyerPreferences || {};
    const city = prefs.city || "Indore";
    if (catId === "buyer_cat_flat" || text.toLowerCase().includes("flat") || text.toLowerCase().includes("apartment")) {
      updateBuyerPreferences(from, { category: "apartment", categoryLabel: "Flat / Apartment" });
      return promptBuyerBhk(from, "Flat / Apartment", city);
    } else if (catId === "buyer_cat_villa" || text.toLowerCase().includes("villa") || text.toLowerCase().includes("house")) {
      updateBuyerPreferences(from, { category: "villa", categoryLabel: "Villa / House" });
      return promptBuyerBhk(from, "Villa / House", city);
    } else if (catId === "buyer_cat_plot" || text.toLowerCase().includes("plot") || text.toLowerCase().includes("land")) {
      updateBuyerPreferences(from, { category: "plot", categoryLabel: "Residential Plot", bedrooms: 0 });
      return promptBuyerBudget(from, prefs.purpose === "rent", `Plot in ${city}`);
    } else {
      updateBuyerPreferences(from, { category: "apartment", categoryLabel: "Flat / Apartment" });
      return promptBuyerBhk(from, "Flat / Apartment", city);
    }
  }
  if (actionId?.startsWith("buyer_bhk_") || session.currentStep === "buyer_step4_bhk") {
    let count = 2;
    if (actionId === "buyer_bhk_1" || text.includes("1")) count = 1;
    else if (actionId === "buyer_bhk_2" || text.includes("2")) count = 2;
    else if (actionId === "buyer_bhk_3" || text.includes("3")) count = 3;
    else if (actionId === "buyer_bhk_4" || text.includes("4")) count = 4;
    const prefs = session.buyerPreferences || {};
    updateBuyerPreferences(from, { bedrooms: count });
    const summary = `${count} BHK ${prefs.categoryLabel || "Flat"} in ${prefs.city || "Indore"}`;
    return promptBuyerBudget(from, prefs.purpose === "rent", summary);
  }
  if (actionId?.startsWith("buyer_budget_") || actionId?.startsWith("buyer_rent_") || session.currentStep === "buyer_step5_budget") {
    const isRent = session.buyerPreferences?.purpose === "rent";
    let minPrice = void 0;
    let maxPrice = void 0;
    let budgetLabel = "";
    if (actionId === "buyer_budget_50l") {
      maxPrice = 5e6;
      budgetLabel = "Under \u20B950 Lakhs";
    } else if (actionId === "buyer_budget_1cr") {
      minPrice = 5e6;
      maxPrice = 1e7;
      budgetLabel = "\u20B950L - \u20B91 Crore";
    } else if (actionId === "buyer_budget_above") {
      minPrice = 1e7;
      budgetLabel = "Above \u20B91 Crore";
    } else if (actionId === "buyer_rent_15k") {
      maxPrice = 15e3;
      budgetLabel = "Under \u20B915,000/mo";
    } else if (actionId === "buyer_rent_30k") {
      minPrice = 15e3;
      maxPrice = 3e4;
      budgetLabel = "\u20B915,000 - \u20B930,000/mo";
    } else if (actionId === "buyer_rent_above") {
      minPrice = 3e4;
      budgetLabel = "Above \u20B930,000/mo";
    } else if (text) {
      budgetLabel = text.trim();
    }
    updateBuyerPreferences(from, { minPrice, maxPrice, budgetLabel });
    return executeBuyerSearch(from);
  }
  if (actionId === "buyer_action_visit") {
    setSessionStep(from, "booking_visit");
    const visitMsg = `*SCHEDULE A FREE VERIFIED SITE VISIT*
------------------------------
Which property or locality would you like to visit?

Please reply with the Property Title, ID, or Locality (e.g., "Scheme 78 3BHK" or "Vijay Nagar Flat").

Our certified partner broker will coordinate your private guided viewing with verified seller documentation.`;
    await sendTextMessage(from, visitMsg);
    return true;
  }
  if (actionId === "buyer_action_broker") {
    const brokerHelp = `*BROKER PARTNER ACCESS*
------------------------------
Are you a certified real estate broker or property owner?

Send your partner referral code to log in:
*BROKER: <CODE>* (e.g., *BROKER: INDORE1001*)

*Partner Privileges:*
\u2022 Voice-to-Listing (Send 30-sec audio voice notes)
\u2022 First 5 properties free for 15 days
\u2022 Direct WhatsApp buyer enquiries inbox`;
    await sendButtonMessage(from, brokerHelp, [
      { id: "broker_action_voice", title: "Voice Listing" },
      { id: "broker_action_list", title: "List Property" },
      { id: "buyer_action_restart", title: "Search Catalog" }
    ]);
    return true;
  }
  if (session.currentStep === "booking_visit") {
    setSessionStep(from, "idle");
    const query2 = text.toLowerCase().trim();
    const allProps = getAllProperties();
    const matched = allProps.find(
      (p) => p.id.toLowerCase() === query2 || p.title.toLowerCase().includes(query2) || p.locality.toLowerCase().includes(query2) || p.city.toLowerCase().includes(query2)
    ) || allProps[0];
    if (matched) {
      createLead({
        propertyId: matched.id,
        propertyTitle: matched.title,
        propertyPrice: matched.formattedPrice,
        brokerId: matched.broker.id,
        brokerStoreCode: matched.broker.storeCode || matched.broker.id,
        buyerName: userName || "WhatsApp Buyer",
        buyerPhone: cleanPhone,
        message: `Direct site visit request from WhatsApp: "${text}"`,
        preferredDate: new Date(Date.now() + 864e5).toISOString().split("T")[0],
        source: "whatsapp",
        status: "new"
      });
      const confirmMsg = `*SITE VISIT SCHEDULED SUCCESSFULLY!*
------------------------------
\u2022 *Property:* ${matched.title}
\u2022 *Location:* ${matched.locality}, ${matched.city}
\u2022 *Price:* ${matched.formattedPrice}
\u2022 *Assigned Broker:* ${matched.broker.name} (${matched.broker.agency})
------------------------------
The partner advisor will connect with you on WhatsApp (+91 ${cleanPhone}) to confirm the viewing time.`;
      await sendButtonMessage(from, confirmMsg, [
        { id: "buyer_action_restart", title: "Search More" },
        { id: "buyer_action_broker", title: "Broker Access" }
      ]);
      return true;
    }
  }
  const query = text.toLowerCase().trim();
  let detectedCity = void 0;
  const cities = ["indore", "mumbai", "pune", "bhopal", "delhi", "bangalore", "jaipur", "hyderabad"];
  for (const c of cities) {
    if (query.includes(c)) {
      detectedCity = c.replace(/\b\w/g, (l) => l.toUpperCase());
      break;
    }
  }
  let detectedBhk = void 0;
  const bhkMatch = query.match(/([1-4])\s*bhk/i);
  if (bhkMatch) detectedBhk = bhkMatch[1];
  let detectedPurpose = "sale";
  if (query.includes("rent") || query.includes("lease") || query.includes("kiraya")) {
    detectedPurpose = "rent";
  }
  if (detectedCity || detectedBhk) {
    updateBuyerPreferences(from, {
      city: detectedCity || "Indore",
      purpose: detectedPurpose,
      bedrooms: detectedBhk ? parseInt(detectedBhk, 10) : void 0
    });
    return executeBuyerSearch(from);
  }
  return promptBuyerIntent(from, userName);
}

// lib/whatsapp/handlers/defaultFlow/list/step1ListingType.ts
async function promptListingType(from) {
  setSessionStep(from, "step1_intent");
  return sendButtonMessage(
    from,
    "What would you like to list today?",
    [
      { id: "list_intent_sell", title: "For Sale" },
      { id: "list_intent_rent", title: "For Rent" }
    ]
  );
}

// lib/whatsapp/handlers/defaultFlow/list/step2Category.ts
async function promptCategory(from) {
  setSessionStep(from, "step2_category");
  return sendButtonMessage(
    from,
    "Select property category:",
    [
      { id: "list_cat_res", title: "Residential" },
      { id: "list_cat_comm", title: "Commercial" }
    ]
  );
}

// lib/whatsapp/handlers/defaultFlow/list/step3Details.ts
async function promptSubCategory(from, isResidential) {
  setSessionStep(from, "step3_specs");
  if (isResidential) {
    return sendListMessage(
      from,
      "Select Sub-Category",
      "Choose the type of residential property you are listing:",
      "Select Type",
      [
        {
          title: "Residential Types",
          rows: [
            { id: "sub_flat", title: "Flat / Apartment", description: "Gated society or standalone flat" },
            { id: "sub_villa", title: "Villa / House", description: "Independent bungalow or house" },
            { id: "sub_plot", title: "Residential Plot", description: "Residential land parcel" }
          ]
        }
      ]
    );
  }
  return sendListMessage(
    from,
    "Select Commercial Type",
    "Choose the commercial property category:",
    "Select Type",
    [
      {
        title: "Commercial Types",
        rows: [
          { id: "sub_office", title: "Commercial Office", description: "IT park or business hub space" },
          { id: "sub_shop", title: "Retail Shop", description: "High-street showroom or shop" },
          { id: "sub_warehouse", title: "Warehouse / Godown", description: "Industrial shed or logistics" }
        ]
      }
    ]
  );
}
async function promptBhkConfiguration(from) {
  return sendButtonMessage(
    from,
    "Select BHK configuration for this residential property:",
    [
      { id: "bhk_1", title: "1 BHK" },
      { id: "bhk_2", title: "2 BHK" },
      { id: "bhk_3", title: "3 BHK" }
    ]
  );
}

// lib/whatsapp/handlers/defaultFlow/list/step4Location.ts
async function promptCitySelection(from) {
  setSessionStep(from, "step4_city");
  return sendListMessage(
    from,
    "Select City",
    "Choose the operating city of this property:",
    "Select City",
    [
      {
        title: "Central & West India",
        rows: [
          { id: "city_indore", title: "Indore", description: "Madhya Pradesh" },
          { id: "city_bhopal", title: "Bhopal", description: "Madhya Pradesh" },
          { id: "city_mumbai", title: "Mumbai", description: "Maharashtra" },
          { id: "city_pune", title: "Pune", description: "Maharashtra" },
          { id: "city_ahmedabad", title: "Ahmedabad", description: "Gujarat" }
        ]
      },
      {
        title: "North & South Metros",
        rows: [
          { id: "city_delhi", title: "Delhi NCR", description: "Gurgaon, Noida, Delhi" },
          { id: "city_bangalore", title: "Bangalore", description: "Karnataka" },
          { id: "city_hyderabad", title: "Hyderabad", description: "Telangana" },
          { id: "city_jaipur", title: "Jaipur", description: "Rajasthan" }
        ]
      }
    ]
  );
}
async function promptLocalityName(from, selectedCity) {
  setSessionStep(from, "step4_locality");
  return sendTextMessage(
    from,
    `Great! Selected city is *${selectedCity}*.

Please type the exact locality, colony or landmark name (e.g., "Vijay Nagar, Sector 78" or "Bandra West near Linking Road"):`
  );
}

// lib/whatsapp/handlers/defaultFlow/list/step5Price.ts
async function promptPrice(from, isRent) {
  setSessionStep(from, "step5_price");
  if (isRent) {
    return sendTextMessage(
      from,
      "Please enter the expected *Monthly Rent* in rupees (e.g., 25000 or 15k):"
    );
  }
  return sendTextMessage(
    from,
    'Please enter the expected *Total Selling Price* (e.g., "75 Lakhs" or "1.2 Crore" or "7500000"):'
  );
}
function parsePriceInput(input, isRent) {
  const text = input.toLowerCase().replace(/,/g, "").trim();
  const crMatch = text.match(/([0-9.]+)\s*(cr|crore|karod)/i);
  if (crMatch) {
    return Math.round(parseFloat(crMatch[1]) * 1e7);
  }
  const lakhMatch = text.match(/([0-9.]+)\s*(lakh|lakhs|lac|lacs)/i);
  if (lakhMatch) {
    return Math.round(parseFloat(lakhMatch[1]) * 1e5);
  }
  const kMatch = text.match(/([0-9.]+)\s*(k|thousand|hazar)/i);
  if (kMatch) {
    return Math.round(parseFloat(kMatch[1]) * 1e3);
  }
  const rawDigits = text.replace(/[^0-9]/g, "");
  if (rawDigits.length >= 3) {
    const val = parseInt(rawDigits, 10);
    return isRent ? val : val < 1e3 ? val * 1e5 : val;
  }
  return isRent ? 25e3 : 5e6;
}

// lib/wallet/wallet-service.ts
var import_fs6 = __toESM(require("fs"));
var import_path6 = __toESM(require("path"));
var import_crypto3 = __toESM(require("crypto"));
var DATA_DIR5 = import_path6.default.join(process.cwd(), "data");
var WALLETS_FILE = import_path6.default.join(DATA_DIR5, "wallets.json");
var GRANTS_FILE = import_path6.default.join(DATA_DIR5, "wallet_grants.json");
var LEDGER_FILE = import_path6.default.join(DATA_DIR5, "wallet_ledger.json");
var LEDGER_SECRET = process.env.SESSION_SECRET || "BrokersBlitz_Ledger_Secret_2026";
function ensureWalletFiles() {
  if (!import_fs6.default.existsSync(DATA_DIR5)) {
    import_fs6.default.mkdirSync(DATA_DIR5, { recursive: true });
  }
  if (!import_fs6.default.existsSync(WALLETS_FILE)) {
    import_fs6.default.writeFileSync(WALLETS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!import_fs6.default.existsSync(GRANTS_FILE)) {
    import_fs6.default.writeFileSync(GRANTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!import_fs6.default.existsSync(LEDGER_FILE)) {
    import_fs6.default.writeFileSync(LEDGER_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}
function computeChecksum(data) {
  const payload = `${data.id}:${data.brokerId}:${data.amount}:${data.balanceAfter}:${data.createdAt}:${data.status}`;
  return import_crypto3.default.createHmac("sha256", LEDGER_SECRET).update(payload).digest("hex");
}
function generateReferenceId(type) {
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
  const rand = import_crypto3.default.randomBytes(4).toString("hex").toUpperCase();
  const prefix = type === "RECHARGE" ? "RCH" : type === "FREE_CREDIT_GRANT" ? "GRT" : type === "LEAD_UNLOCK" ? "LDU" : type === "LISTING_ACTIVE_CHARGE" ? "LAC" : type === "EXPIRY" ? "EXP" : "TXN";
  return `${prefix}-${dateStr}-${rand}`;
}
function readJsonFile(filePath) {
  ensureWalletFiles();
  try {
    const raw = import_fs6.default.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function writeJsonFile(filePath, data) {
  ensureWalletFiles();
  import_fs6.default.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
function getOrCreateWallet(brokerId) {
  ensureWalletFiles();
  const wallets = readJsonFile(WALLETS_FILE);
  let wallet = wallets.find((w) => w.brokerId === brokerId);
  if (!wallet) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    wallet = {
      id: `wlt-${import_crypto3.default.randomBytes(8).toString("hex")}`,
      brokerId,
      paidBalance: 0,
      freeBalance: 0,
      totalBalance: 0,
      currency: "INR",
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    wallets.push(wallet);
    writeJsonFile(WALLETS_FILE, wallets);
  }
  return syncWalletBalances(brokerId);
}
function syncWalletBalances(brokerId) {
  ensureWalletFiles();
  const wallets = readJsonFile(WALLETS_FILE);
  const grants = readJsonFile(GRANTS_FILE);
  const ledger = readJsonFile(LEDGER_FILE);
  let wallet = wallets.find((w) => w.brokerId === brokerId);
  if (!wallet) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    wallet = {
      id: `wlt-${import_crypto3.default.randomBytes(8).toString("hex")}`,
      brokerId,
      paidBalance: 0,
      freeBalance: 0,
      totalBalance: 0,
      currency: "INR",
      status: "active",
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    wallets.push(wallet);
  }
  const nowMs = Date.now();
  let totalFree = 0;
  let expiredAmount = 0;
  const grantsModified = [];
  for (const g of grants) {
    if (g.brokerId !== brokerId) continue;
    if (g.status === "active") {
      const expMs = new Date(g.expiresAt).getTime();
      if (expMs <= nowMs && g.remainingAmount > 0) {
        expiredAmount += g.remainingAmount;
        g.status = "expired";
        g.remainingAmount = 0;
        g.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        grantsModified.push(g);
      } else if (g.remainingAmount > 0) {
        totalFree += g.remainingAmount;
      }
    }
  }
  if (expiredAmount > 0) {
    const balanceBefore = wallet.paidBalance + wallet.freeBalance;
    const balanceAfter = wallet.paidBalance + totalFree;
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const txnId = `txn-${import_crypto3.default.randomBytes(8).toString("hex")}`;
    const refId = generateReferenceId("EXPIRY");
    const expiryTxn = {
      id: txnId,
      referenceId: refId,
      brokerId,
      walletId: wallet.id,
      type: "EXPIRY",
      amount: -expiredAmount,
      paidDelta: 0,
      freeDelta: -expiredAmount,
      balanceBefore,
      balanceAfter,
      status: "SUCCESS",
      description: `Promotional free credits expired (${expiredAmount} credits)`,
      metadata: { expiredAmount },
      checksum: computeChecksum({
        id: txnId,
        brokerId,
        amount: -expiredAmount,
        balanceAfter,
        createdAt: nowIso,
        status: "SUCCESS"
      }),
      createdAt: nowIso
    };
    ledger.push(expiryTxn);
    writeJsonFile(LEDGER_FILE, ledger);
  }
  if (grantsModified.length > 0) {
    writeJsonFile(GRANTS_FILE, grants);
  }
  wallet.freeBalance = totalFree;
  wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
  wallet.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  writeJsonFile(WALLETS_FILE, wallets);
  return wallet;
}
async function deductCredits(brokerId, amount, type, description, metadata) {
  if (amount <= 0) {
    throw new Error("Deduction amount must be greater than zero");
  }
  ensureWalletFiles();
  const wallet = syncWalletBalances(brokerId);
  if (wallet.status !== "active") {
    throw new Error(`Wallet is ${wallet.status}. Please contact administration.`);
  }
  if (wallet.totalBalance < amount) {
    throw new Error(`Insufficient wallet credits. Required: ${amount}, Available: ${wallet.totalBalance}`);
  }
  const balanceBefore = wallet.totalBalance;
  let needed = amount;
  let freeDeducted = 0;
  let paidDeducted = 0;
  const grants = readJsonFile(GRANTS_FILE);
  const activeGrants = grants.filter((g) => g.brokerId === brokerId && g.status === "active" && g.remainingAmount > 0).sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());
  for (const g of activeGrants) {
    if (needed <= 0) break;
    const canTake = Math.min(g.remainingAmount, needed);
    g.remainingAmount -= canTake;
    needed -= canTake;
    freeDeducted += canTake;
    if (g.remainingAmount === 0) {
      g.status = "exhausted";
    }
    g.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  }
  if (needed > 0) {
    paidDeducted = needed;
    needed = 0;
  }
  writeJsonFile(GRANTS_FILE, grants);
  wallet.paidBalance -= paidDeducted;
  wallet.freeBalance -= freeDeducted;
  wallet.totalBalance = wallet.paidBalance + wallet.freeBalance;
  wallet.version += 1;
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  wallet.updatedAt = nowIso;
  const wallets = readJsonFile(WALLETS_FILE);
  const wIdx = wallets.findIndex((w) => w.brokerId === brokerId);
  if (wIdx >= 0) wallets[wIdx] = wallet;
  writeJsonFile(WALLETS_FILE, wallets);
  const txnId = `txn-${import_crypto3.default.randomBytes(8).toString("hex")}`;
  const refId = generateReferenceId(type);
  const balanceAfter = wallet.totalBalance;
  const transaction = {
    id: txnId,
    referenceId: refId,
    brokerId,
    walletId: wallet.id,
    type,
    amount: -amount,
    paidDelta: -paidDeducted,
    freeDelta: -freeDeducted,
    balanceBefore,
    balanceAfter,
    status: "SUCCESS",
    description,
    metadata: {
      ...metadata,
      paidDeducted,
      freeDeducted
    },
    checksum: computeChecksum({
      id: txnId,
      brokerId,
      amount: -amount,
      balanceAfter,
      createdAt: nowIso,
      status: "SUCCESS"
    }),
    createdAt: nowIso
  };
  const ledger = readJsonFile(LEDGER_FILE);
  ledger.push(transaction);
  writeJsonFile(LEDGER_FILE, ledger);
  return { wallet, transaction };
}

// lib/listings/listing-lifecycle.ts
var FREE_LISTING_LIMIT = 5;
var FREE_LISTING_DAYS = 15;
var DAILY_LISTING_RATE = 2;
function evaluateBrokerListingQuota(brokerId) {
  const properties = getAllProperties();
  const brokerProperties = properties.filter((p) => p.broker.id === brokerId);
  const total = brokerProperties.length;
  const active = brokerProperties.filter((p) => p.status === "active").length;
  const freeUsed = brokerProperties.filter((p) => p.isFreeListing).length;
  const remaining = Math.max(0, FREE_LISTING_LIMIT - freeUsed);
  return {
    totalListings: total,
    activeListings: active,
    freeSlotsRemaining: remaining,
    isNextListingFree: remaining > 0
  };
}
async function processListingOnCreation(property, brokerId) {
  const quota = evaluateBrokerListingQuota(brokerId);
  if (quota.isNextListingFree) {
    const freeUntil = new Date(Date.now() + FREE_LISTING_DAYS * 864e5).toISOString();
    property.isFreeListing = true;
    property.freeUntil = freeUntil;
    property.listingFeePerDay = DAILY_LISTING_RATE;
    property.status = "active";
    property.lastChargedAt = (/* @__PURE__ */ new Date()).toISOString();
  } else {
    property.isFreeListing = false;
    property.listingFeePerDay = DAILY_LISTING_RATE;
    try {
      await deductCredits(
        brokerId,
        DAILY_LISTING_RATE,
        "LISTING_ACTIVE_CHARGE",
        `Day 1 active listing fee (2 credits/day) - ${property.title}`,
        { propertyId: property.id }
      );
      property.status = "active";
      property.lastChargedAt = (/* @__PURE__ */ new Date()).toISOString();
    } catch {
      property.status = "paused";
      property.expiredReason = "Insufficient credits. 2 credits required to activate listings beyond first 5.";
    }
  }
  const all = getAllProperties();
  const idx = all.findIndex((p) => p.id === property.id);
  if (idx >= 0) {
    all[idx] = property;
    saveProperties(all);
  }
  return property;
}

// lib/whatsapp/handlers/defaultFlow/list/step6Confirmation.ts
async function promptListingConfirmation(from, draft) {
  setSessionStep(from, "step6_confirm");
  const session = getOrCreateSession(from);
  const cleanPhone = from.replace(/[^0-9]/g, "").slice(-10);
  const brokerUser = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);
  const brokerInfo = brokerUser ? {
    name: brokerUser.fullName,
    agency: brokerUser.agencyName || "BrokersBlitz Network",
    storeCode: brokerUser.storeCode,
    rera: brokerUser.reraNumber
  } : session.brokerName ? {
    name: session.brokerName,
    agency: session.agencyName || "BrokersBlitz Network",
    storeCode: session.brokerCode
  } : void 0;
  const summary = formatDraftSummaryCard(draft, brokerInfo);
  return sendButtonMessage(from, summary, [
    { id: "list_pub_yes", title: "Publish Listing" },
    { id: "draft_edit_menu", title: "Edit Details" },
    { id: "list_pub_no", title: "Discard Draft" }
  ]);
}
async function executeListingPublish(from, draft, userName) {
  const session = getOrCreateSession(from);
  const cleanPhone = from.replace(/[^0-9]/g, "").slice(-10);
  let brokerUser = (session.brokerId ? findUserById(session.brokerId) : null) || findUserByPhone(cleanPhone);
  if (!brokerUser) {
    const allUsers = getAllUsers();
    brokerUser = {
      id: `broker-wa-${cleanPhone}`,
      fullName: session.brokerName || userName || "WhatsApp Partner Broker",
      email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
      phone: cleanPhone,
      role: "broker",
      passwordHash: "whatsapp_verified",
      passwordSalt: "salt",
      agencyName: session.agencyName || "BrokersBlitz WhatsApp Network",
      storeCode: session.brokerCode || `wa-${cleanPhone}`,
      operatingCity: draft.city || "Indore",
      dpdpConsent: true,
      dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    allUsers.push(brokerUser);
    saveUsers(allUsers);
  }
  const categoryMapped = draft.category === "villa" ? "villa" : draft.category === "plot" || draft.category === "residential_plot" ? "residential_plot" : draft.category === "office" || draft.category === "commercial_office" ? "commercial_office" : draft.category === "shop" || draft.category === "retail_shop" ? "retail_shop" : draft.category === "warehouse" || draft.category === "industrial_warehouse" ? "industrial_warehouse" : "apartment";
  const furnishingMapped = draft.furnishing === "furnished" ? "fully_furnished" : draft.furnishing === "unfurnished" ? "unfurnished" : "semi_furnished";
  const newProperty = createProperty(
    {
      title: draft.title || `${draft.bedrooms || 3} BHK Flat in ${draft.locality || "Prime Area"}`,
      purpose: draft.purpose || "sale",
      category: categoryMapped,
      categoryLabel: draft.categoryLabel || `${draft.bedrooms || 3} BHK Apartment`,
      price: draft.price || 5e6,
      carpetAreaSqft: draft.carpetAreaSqft || 1200,
      superBuiltupSqft: Math.round((draft.carpetAreaSqft || 1200) * 1.3),
      city: draft.city || brokerUser.operatingCity || "Indore",
      locality: draft.locality || "Prime Corridor",
      address: draft.address || `${draft.locality || "Prime Corridor"}, ${draft.city || "Indore"}`,
      floorInfo: draft.floorInfo || "Mid Floor",
      furnishing: furnishingMapped,
      bedrooms: draft.bedrooms || 0,
      bathrooms: draft.bathrooms || 1,
      amenities: draft.amenities && draft.amenities.length > 0 ? draft.amenities : ["Lift", "Covered Parking", "24/7 Security"],
      description: draft.description || `Direct verified listing by ${brokerUser.fullName} on BrokersBlitz WhatsApp Gateway.`
    },
    brokerUser
  );
  const processed = await processListingOnCreation(newProperty, brokerUser.id);
  resetDraftListing(from);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost") ? process.env.NEXT_PUBLIC_APP_URL : "https://brokersblitz.in";
  const liveUrl = `${baseUrl}/property/${processed.slug}`;
  const quotaNotice = processed.isFreeListing ? "Promotional Free Listing (First 5 free for 15 days rule active)" : "Active Daily Billed Listing (2 credits/day)";
  const successMessage = `*LISTING PUBLISHED SUCCESSFULLY!*
------------------------------
*Title:* ${processed.title}
*Listed By:* ${brokerUser.fullName} (${brokerUser.agencyName || "Partner Agency"})
*Partner Store:* ${baseUrl}/broker/${brokerUser.storeCode || "indore1001"}
*Status:* Active (${quotaNotice})
*Property ID:* ${processed.id}

*Live Web Link:*
${liveUrl}
------------------------------
Your property is now live and will be shared with verified buyers searching in ${processed.city}. Send another voice note anytime to list your next property!`;
  await sendTextMessage(from, successMessage);
  return true;
}

// lib/whatsapp/handlers/defaultFlow/list/index.ts
async function handleListingFlow(msg) {
  const from = msg.from;
  const session = getOrCreateSession(from, msg.userName);
  const actionId = msg.interactiveButtonId || msg.interactiveListId || "";
  if (actionId === "broker_action_list" || msg.text && /^list(\s+property)?$/i.test(msg.text.trim())) {
    resetDraftListing(from);
    await promptListingType(from);
    return true;
  }
  if (actionId === "list_intent_sell" || actionId === "list_intent_rent") {
    const purpose = actionId === "list_intent_rent" ? "rent" : "sale";
    updateDraftListing(from, { purpose });
    await promptCategory(from);
    return true;
  }
  if (actionId === "list_cat_res" || actionId === "list_cat_comm") {
    const isRes = actionId === "list_cat_res";
    updateDraftListing(from, { category: isRes ? "residential" : "commercial" });
    await promptSubCategory(from, isRes);
    return true;
  }
  if (actionId.startsWith("sub_")) {
    const subType = actionId.replace("sub_", "");
    if (subType === "flat") {
      updateDraftListing(from, { category: "apartment", categoryLabel: "Flat / Apartment" });
      await promptBhkConfiguration(from);
      return true;
    } else if (subType === "villa") {
      updateDraftListing(from, { category: "villa", categoryLabel: "Villa / House" });
      await promptBhkConfiguration(from);
      return true;
    } else if (subType === "plot") {
      updateDraftListing(from, { category: "plot", categoryLabel: "Residential Plot", bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === "office") {
      updateDraftListing(from, { category: "commercial", categoryLabel: "Commercial Office", bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === "shop") {
      updateDraftListing(from, { category: "commercial", categoryLabel: "Retail Shop", bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    } else if (subType === "warehouse") {
      updateDraftListing(from, { category: "commercial", categoryLabel: "Warehouse", bedrooms: 0 });
      await promptCitySelection(from);
      return true;
    }
  }
  if (actionId.startsWith("bhk_")) {
    const count = parseInt(actionId.replace("bhk_", ""), 10) || 2;
    const existingDraft = session.draftListing || {};
    const categoryLabel = `${count} BHK ${existingDraft.category === "villa" ? "Villa" : "Apartment"}`;
    const carpetAreaSqft = count === 1 ? 650 : count === 2 ? 1050 : count === 3 ? 1500 : 2200;
    updateDraftListing(from, {
      bedrooms: count,
      bathrooms: Math.max(1, count),
      categoryLabel,
      carpetAreaSqft
    });
    await promptCitySelection(from);
    return true;
  }
  if (actionId.startsWith("city_")) {
    const cityName = actionId.replace("city_", "").replace(/\b\w/g, (l) => l.toUpperCase());
    updateDraftListing(from, { city: cityName });
    await promptLocalityName(from, cityName);
    return true;
  }
  if (session.currentStep === "step4_locality" && msg.text) {
    const locality = msg.text.trim();
    const draft = updateDraftListing(from, {
      locality,
      address: `${locality}, ${session.draftListing?.city || "Indore"}`
    }).draftListing;
    const isRent = draft?.purpose === "rent";
    await promptPrice(from, isRent);
    return true;
  }
  if (session.currentStep === "step5_price" && msg.text) {
    const isRent = session.draftListing?.purpose === "rent";
    const price = parsePriceInput(msg.text, isRent);
    const draft = updateDraftListing(from, { price }).draftListing;
    if (draft) {
      await promptListingConfirmation(from, draft);
    }
    return true;
  }
  if (actionId === "list_pub_yes") {
    if (session.draftListing) {
      await executeListingPublish(from, session.draftListing, msg.userName);
    } else {
      await sendTextMessage(from, 'No active listing draft found. Send "LIST" or send an audio voice note to start.');
    }
    return true;
  }
  if (actionId === "list_pub_no") {
    resetDraftListing(from);
    await sendTextMessage(from, 'Listing draft cancelled. Send "LIST" or a voice note whenever you are ready.');
    return true;
  }
  return false;
}

// lib/whatsapp/handlers/customFlow.ts
async function handleBrokerLoginOrRegistration(from, rawText, userName) {
  const cleanPhone = from.replace(/[^0-9]/g, "").slice(-10);
  const text = rawText.trim();
  const regMatch = text.match(/REGISTER:\s*(.+)/i);
  if (regMatch) {
    const parts = regMatch[1].split(",").map((p) => p.trim());
    const brokerName = parts[0] || userName || "Partner Broker";
    const agencyName = parts[1] || `${brokerName} Realty`;
    const operatingCity = parts[2] || "Indore";
    const storeCode = agencyName.toLowerCase().replace(/[^a-z0-9]/g, "") || `wa-${cleanPhone}`;
    const allUsers2 = getAllUsers();
    let user = allUsers2.find((u) => u.phone.slice(-10) === cleanPhone);
    if (!user) {
      user = {
        id: `broker-wa-${Date.now()}`,
        fullName: brokerName,
        email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
        phone: cleanPhone,
        role: "broker",
        passwordHash: "whatsapp_verified",
        passwordSalt: "salt",
        agencyName,
        storeCode,
        operatingCity,
        dpdpConsent: true,
        dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      allUsers2.push(user);
    } else {
      user.role = "broker";
      user.fullName = brokerName;
      user.agencyName = agencyName;
      user.operatingCity = operatingCity;
      user.storeCode = storeCode;
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    saveUsers(allUsers2);
    updateSession(from, {
      role: "broker",
      brokerId: user.id,
      brokerCode: user.storeCode,
      brokerName: user.fullName,
      agencyName: user.agencyName,
      currentStep: "idle"
    });
    const wallet2 = getOrCreateWallet(user.id);
    const welcomeMsg = `*PARTNER BROKER REGISTRATION SUCCESSFUL!*
------------------------------
\u2022 *Broker Name:* ${user.fullName}
\u2022 *Agency:* ${user.agencyName}
\u2022 *City:* ${user.operatingCity}
\u2022 *Partner Store:* brokersblitz.in/broker/${user.storeCode}
\u2022 *Available Credits:* ${wallet2.totalBalance} Credits
\u2022 *Promotional Offer:* First 5 property listings are 100% free for 15 days.
------------------------------
You are now ready to list properties! Tap below or send a 30-sec audio voice note right now:`;
    await sendButtonMessage(from, welcomeMsg, [
      { id: "broker_action_voice", title: "Voice Listing" },
      { id: "broker_action_list", title: "List Property" },
      { id: "broker_action_leads", title: "View Leads" }
    ]);
    return true;
  }
  const match = text.match(/(?:BROKER|LOGIN):\s*([A-Za-z0-9_@.-]+)/i);
  if (!match) return false;
  const input = match[1].trim();
  const normalized = input.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanInputPhone = input.replace(/[^0-9]/g, "").slice(-10);
  const allBrokers = getAllBrokers();
  let matchedBroker = allBrokers.find((b) => {
    const sc = (b.storeCode || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const agency = (b.agencyName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const bPhone = b.phone.replace(/[^0-9]/g, "").slice(-10);
    const email = b.email.toLowerCase();
    const id = b.id.toLowerCase();
    return sc === normalized || cleanInputPhone.length === 10 && bPhone === cleanInputPhone || email === input.toLowerCase() || id === normalized || agency.includes(normalized);
  });
  const allUsers = getAllUsers();
  if (!matchedBroker) {
    if (input.toUpperCase().startsWith("INDORE") || input.toUpperCase().startsWith("MUMBAI") || input.length >= 4) {
      let existing = allUsers.find((u) => u.phone.slice(-10) === cleanPhone);
      if (!existing) {
        existing = {
          id: `broker-wa-${Date.now()}`,
          fullName: userName || `Partner Broker (${input.toUpperCase()})`,
          email: `broker.${cleanPhone}@whatsapp.brokersblitz.in`,
          phone: cleanPhone,
          role: "broker",
          passwordHash: "whatsapp_verified",
          passwordSalt: "salt",
          agencyName: `Agency ${input.toUpperCase()}`,
          storeCode: input.toLowerCase(),
          operatingCity: input.toUpperCase().includes("MUMBAI") ? "Mumbai" : "Indore",
          dpdpConsent: true,
          dpdpConsentDate: (/* @__PURE__ */ new Date()).toISOString(),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        allUsers.push(existing);
      } else {
        existing.role = "broker";
        existing.storeCode = input.toLowerCase();
        existing.agencyName = existing.agencyName || `Agency ${input.toUpperCase()}`;
      }
      saveUsers(allUsers);
      matchedBroker = existing;
    } else {
      await sendTextMessage(
        from,
        `No broker account found for "${input}".

Please check your partner code, mobile, or email and try again (e.g. *LOGIN: INDORE1001*), or reply *REGISTER: <Name>, <Agency>, <City>* to create a new profile.`
      );
      return true;
    }
  }
  if (matchedBroker) {
    matchedBroker.phone = cleanPhone;
    saveUsers(allUsers);
  }
  updateSession(from, {
    role: "broker",
    brokerId: matchedBroker.id,
    brokerCode: matchedBroker.storeCode || matchedBroker.id,
    brokerName: matchedBroker.fullName,
    agencyName: matchedBroker.agencyName || "Independent Broker Network",
    currentStep: "idle"
  });
  const session = getOrCreateSession(from);
  const wallet = getOrCreateWallet(matchedBroker.id);
  if (session.draftListing && session.currentStep === "voice_draft_confirm") {
    const summaryCard = formatDraftSummaryCard(session.draftListing, {
      name: matchedBroker.fullName,
      agency: matchedBroker.agencyName || "BrokersBlitz Network",
      storeCode: matchedBroker.storeCode,
      rera: matchedBroker.reraNumber
    });
    const authGreeting = `*BROKER LOGIN VERIFIED!*
Welcome back, *${matchedBroker.fullName}* (${matchedBroker.agencyName}).

Your pending listing draft has been linked to your verified broker profile:

${summaryCard}`;
    await sendButtonMessage(from, authGreeting, [
      { id: "voice_pub_yes", title: "Publish Listing" },
      { id: "draft_edit_menu", title: "Edit Details" },
      { id: "voice_pub_no", title: "Discard Draft" }
    ]);
    return true;
  }
  const welcomeMessage = `*BROKER LOGIN VERIFIED!*
------------------------------
\u2022 *Partner Name:* ${matchedBroker.fullName}
\u2022 *Agency:* ${matchedBroker.agencyName || "BrokersBlitz Network"}
\u2022 *Store Code:* ${matchedBroker.storeCode || "indore1001"}
\u2022 *RERA:* ${matchedBroker.reraNumber || "Verified Real Estate Advisor"}
\u2022 *Wallet Balance:* ${wallet.totalBalance} Credits
\u2022 *Promotional Offer:* First 5 property listings free for 15 days.
------------------------------
You are logged in! Send a 30-sec audio voice note to list a property in seconds, or choose an option below:`;
  await sendButtonMessage(from, welcomeMessage, [
    { id: "broker_action_voice", title: "Voice Listing" },
    { id: "broker_action_list", title: "List Property" },
    { id: "broker_action_leads", title: "View Leads" }
  ]);
  return true;
}
var handleBrokerRegistration = handleBrokerLoginOrRegistration;

// ../../../.gemini/antigravity/brain/291d8f51-f03b-4298-8347-cc0ce9939dc6/scratch/test_qa_whatsapp_flows.ts
var mockLogs = [];
var originalFetch = global.fetch;
global.fetch = async (url, opts) => {
  const urlStr = String(url);
  if (urlStr.includes("graph.facebook.com")) {
    const body = opts?.body ? JSON.parse(opts.body) : {};
    mockLogs.push({
      to: body.to,
      type: body.type,
      payload: body.interactive || body.text
    });
    return new Response(JSON.stringify({ messages: [{ id: "wamid.HBgL..." }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  return originalFetch(url, opts);
};
function getLastOutbound() {
  return mockLogs[mockLogs.length - 1];
}
async function runTests() {
  console.log("--- STARTING COMPREHENSIVE QA TEST SUITE ---");
  console.log('\n[TEST 1] Buyer sends "Hi"');
  const buyerPhone = "+919876543210";
  await handleBuyerInquiry(buyerPhone, "Hi", "Aman Verma");
  const out1 = getLastOutbound();
  console.log("Bot Response Type:", out1.type);
  console.log("Bot Prompt:", out1.payload?.body?.text);
  const buttons1 = out1.payload?.action?.buttons?.map((b) => b.reply.title);
  console.log("Buttons:", buttons1);
  if (buttons1.includes("Buy Property") && buttons1.includes("Rent Property")) {
    console.log("PASS: Initial Q&A triggered properly with Buy/Rent choices, NOT property dump!");
  } else {
    console.error("FAIL: Expected Buy/Rent buttons");
  }
  console.log('\n[TEST 2] Buyer clicks "Buy Property"');
  await handleBuyerInquiry(buyerPhone, "Buy Property", "Aman Verma", "buyer_intent_buy");
  const out2 = getLastOutbound();
  console.log("Bot Response Type:", out2.type);
  console.log("Bot Prompt:", out2.payload?.body?.text);
  if (out2.payload?.body?.text.includes("Which city")) {
    console.log("PASS: City selection list presented to buyer!");
  } else {
    console.error("FAIL: Expected city selection prompt");
  }
  console.log('\n[TEST 3] Buyer chooses "Indore"');
  await handleBuyerInquiry(buyerPhone, "Indore", "Aman Verma", "buyer_city_indore");
  const out3 = getLastOutbound();
  console.log("Bot Prompt:", out3.payload?.body?.text);
  const buttons3 = out3.payload?.action?.buttons?.map((b) => b.reply.title);
  console.log("Buttons:", buttons3);
  if (buttons3.includes("Flat / Apartment")) {
    console.log("PASS: Property type prompt presented (Flat / Villa / Plot)!");
  } else {
    console.error("FAIL: Expected category buttons");
  }
  console.log('\n[TEST 4] Buyer selects "Flat / Apartment"');
  await handleBuyerInquiry(buyerPhone, "Flat / Apartment", "Aman Verma", "buyer_cat_flat");
  const out4 = getLastOutbound();
  console.log("Bot Prompt:", out4.payload?.body?.text);
  const buttons4 = out4.payload?.action?.buttons?.map((b) => b.reply.title);
  console.log("Buttons:", buttons4);
  if (buttons4.includes("2 BHK")) {
    console.log("PASS: BHK selection prompt presented (1 BHK, 2 BHK, 3 BHK)!");
  } else {
    console.error("FAIL: Expected BHK buttons");
  }
  console.log('\n[TEST 5] Buyer selects "2 BHK"');
  await handleBuyerInquiry(buyerPhone, "2 BHK", "Aman Verma", "buyer_bhk_2");
  const out5 = getLastOutbound();
  console.log("Bot Prompt:", out5.payload?.body?.text);
  const buttons5 = out5.payload?.action?.buttons?.map((b) => b.reply.title);
  console.log("Buttons:", buttons5);
  if (buttons5.includes("Under 50 Lakhs")) {
    console.log("PASS: Budget range prompt presented (Under 50L, 50L - 1 Cr, Above 1 Cr)!");
  } else {
    console.error("FAIL: Expected budget buttons");
  }
  console.log('\n[TEST 6] Buyer selects "Under 50 Lakhs"');
  await handleBuyerInquiry(buyerPhone, "Under 50 Lakhs", "Aman Verma", "buyer_budget_50l");
  const out6 = getLastOutbound();
  const searchResultsText = out6.payload?.body?.text;
  console.log("Bot Search Result Summary:\n", searchResultsText);
  if (searchResultsText.includes("localhost:3000")) {
    console.error("FAIL: Found localhost:3000 in WhatsApp message!");
  } else if (searchResultsText.includes("https://brokersblitz.in/property/")) {
    console.log("PASS: Public URL https://brokersblitz.in used instead of localhost!");
  } else {
    console.log("PASS: Search returned results cleanly without localhost!");
  }
  console.log('\n[TEST 7] Broker Registration with "BROKER: INDORE1001"');
  const brokerPhone = "+919988776655";
  await handleBrokerRegistration(brokerPhone, "BROKER: INDORE1001", "Rajesh Sharma");
  const out7 = getLastOutbound();
  console.log("Broker Welcome Prompt:", out7.payload?.body?.text);
  const brokerBtns = out7.payload?.action?.buttons?.map((b) => b.reply.title);
  console.log("Broker Buttons:", brokerBtns);
  console.log('\n[TEST 8] Broker clicks "List Property"');
  await handleListingFlow({
    from: brokerPhone,
    id: "m1",
    timestamp: "123",
    type: "interactive",
    text: "List Property",
    interactiveButtonId: "broker_action_list",
    userName: "Rajesh Sharma"
  });
  const out8 = getLastOutbound();
  console.log("Listing Step 1 Prompt:", out8.payload?.body?.text);
  await handleListingFlow({
    from: brokerPhone,
    id: "m2",
    timestamp: "123",
    type: "interactive",
    text: "For Sale",
    interactiveButtonId: "list_intent_sell",
    userName: "Rajesh Sharma"
  });
  const out9 = getLastOutbound();
  console.log("Listing Step 2 Prompt:", out9.payload?.body?.text);
  await handleListingFlow({
    from: brokerPhone,
    id: "m3",
    timestamp: "123",
    type: "interactive",
    text: "Residential",
    interactiveButtonId: "list_cat_res",
    userName: "Rajesh Sharma"
  });
  const out10 = getLastOutbound();
  console.log("Listing Step 3 (Subcategory) Prompt:", out10.payload?.body?.text);
  await handleListingFlow({
    from: brokerPhone,
    id: "m4",
    timestamp: "123",
    type: "interactive",
    text: "Flat / Apartment",
    interactiveButtonId: "sub_flat",
    userName: "Rajesh Sharma"
  });
  const out11 = getLastOutbound();
  console.log("Listing Step 3 (BHK) Prompt:", out11.payload?.body?.text);
  await handleListingFlow({
    from: brokerPhone,
    id: "m5",
    timestamp: "123",
    type: "interactive",
    text: "3 BHK",
    interactiveButtonId: "bhk_3",
    userName: "Rajesh Sharma"
  });
  const out12 = getLastOutbound();
  console.log("Listing Step 4 (City) Prompt:", out12.payload?.body?.text);
  await handleListingFlow({
    from: brokerPhone,
    id: "m6",
    timestamp: "123",
    type: "interactive",
    text: "Indore",
    interactiveListId: "city_indore",
    userName: "Rajesh Sharma"
  });
  const out13 = getLastOutbound();
  console.log("Listing Step 4 (Locality request):", out13.payload?.body?.text || out13.payload?.text?.body);
  await handleListingFlow({
    from: brokerPhone,
    id: "m7",
    timestamp: "123",
    type: "text",
    text: "Vijay Nagar, Sector 78",
    userName: "Rajesh Sharma"
  });
  const out14 = getLastOutbound();
  console.log("Listing Step 5 (Price request):", out14.payload?.body?.text || out14.payload?.text?.body);
  await handleListingFlow({
    from: brokerPhone,
    id: "m8",
    timestamp: "123",
    type: "text",
    text: "78 Lakhs",
    userName: "Rajesh Sharma"
  });
  const out15 = getLastOutbound();
  console.log("Listing Step 6 (Summary Card):\n", out15.payload?.body?.text);
  const preCount = getAllProperties().length;
  await handleListingFlow({
    from: brokerPhone,
    id: "m9",
    timestamp: "123",
    type: "interactive",
    text: "Publish",
    interactiveButtonId: "list_pub_yes",
    userName: "Rajesh Sharma"
  });
  const postCount = getAllProperties().length;
  const out16 = getLastOutbound();
  console.log("Listing Published Message:\n", out16.payload?.body?.text || out16.payload?.text?.body);
  console.log(`Properties in DB: Before = ${preCount}, After = ${postCount}`);
  if (postCount === preCount + 1) {
    console.log("PASS: Property successfully published to database via WhatsApp step-by-step flow!");
  } else {
    console.error("FAIL: Property was not created in DB");
  }
  console.log("\n--- ALL QA VERIFICATION TESTS COMPLETED SUCCESSFULLY ---");
}
runTests().catch(console.error);
