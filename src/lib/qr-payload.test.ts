import { describe, expect, it } from "vitest";
import {
  buildContactPayload,
  buildEmailPayload,
  buildEventPayload,
  buildWhatsAppPayload,
  buildWifiPayload,
  normalizeWebUrl,
} from "./qr-payload";

describe("normalizeWebUrl", () => {
  it("adds HTTPS when the protocol is omitted", () => {
    expect(normalizeWebUrl("belluzzi.dev")).toBe("https://belluzzi.dev");
  });

  it("preserves an existing protocol", () => {
    expect(normalizeWebUrl("http://localhost:3000")).toBe(
      "http://localhost:3000",
    );
  });
});

describe("buildWifiPayload", () => {
  it("escapes reserved Wi-Fi characters", () => {
    expect(
      buildWifiPayload({
        ssid: "Belluzzi;Guest",
        password: "secret:123",
        encryption: "WPA",
        hidden: true,
      }),
    ).toBe("WIFI:T:WPA;S:Belluzzi\\;Guest;P:secret\\:123;H:true;;");
  });

  it("omits the password for open networks", () => {
    expect(
      buildWifiPayload({
        ssid: "Public",
        password: "ignored",
        encryption: "nopass",
      }),
    ).toBe("WIFI:T:nopass;S:Public;H:false;;");
  });
});

describe("buildContactPayload", () => {
  it("creates a vCard and normalizes its website", () => {
    const payload = buildContactPayload({
      name: "Heron Belluzzi",
      organization: "Belluzzi",
      website: "belluzzi.dev",
    });

    expect(payload).toContain("FN:Heron Belluzzi");
    expect(payload).toContain("ORG:Belluzzi");
    expect(payload).toContain("URL:https://belluzzi.dev");
    expect(payload).toMatch(/END:VCARD$/);
  });
});

describe("buildWhatsAppPayload", () => {
  it("keeps phone digits and safely encodes the message", () => {
    expect(buildWhatsAppPayload("+55 (35) 99999-0000", "Olá, Belluzzi!")).toBe(
      "https://wa.me/5535999990000?text=Ol%C3%A1%2C%20Belluzzi!",
    );
  });
});

describe("buildEmailPayload", () => {
  it("creates an email link with encoded parameters", () => {
    expect(
      buildEmailPayload({
        email: "hello@example.com",
        subject: "New project",
        body: "Hello world",
      }),
    ).toBe(
      "mailto:hello@example.com?subject=New+project&body=Hello+world",
    );
  });
});

describe("buildEventPayload", () => {
  it("creates an iCalendar event with escaped fields", () => {
    const payload = buildEventPayload({
      title: "Launch, Belluzzi",
      start: "2026-08-20T09:30",
      end: "2026-08-20T10:30",
      location: "Office; Room 2",
      description: "Open tools\nRelease",
    });

    expect(payload).toContain("SUMMARY:Launch\\, Belluzzi");
    expect(payload).toContain("DTSTART:20260820T093000");
    expect(payload).toContain("DTEND:20260820T103000");
    expect(payload).toContain("LOCATION:Office\\; Room 2");
    expect(payload).toContain("DESCRIPTION:Open tools\\nRelease");
    expect(payload).toMatch(/END:VCALENDAR$/);
  });
});
