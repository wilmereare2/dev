"use client";

import { cn } from "@/lib/utils";

const inputClassName =
  "mt-2 h-11 w-full rounded-xl border border-border bg-background/80 px-3 text-sm text-foreground outline-none transition focus-visible:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-60";

type RegisterProfileFieldsProps = {
  username: string;
  setUsername: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (value: string) => void;
  gender: string;
  setGender: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  race: string;
  setRace: (value: string) => void;
  hobbies: string;
  setHobbies: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  telegram: string;
  setTelegram: (value: string) => void;
  whatsApp: string;
  setWhatsApp: (value: string) => void;
  zangi: string;
  setZangi: (value: string) => void;
};

export function RegisterProfileFields(props: RegisterProfileFieldsProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <h2 className="text-sm font-semibold text-foreground">Public profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Shown on your member profile. Other users contact you by username in chat only.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
              pattern="[A-Za-z0-9]{3,20}"
              value={props.username}
              onChange={(event) => props.setUsername(event.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
              placeholder="jamesmartin"
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-muted-foreground">Letters and numbers only. This is how others find you on site.</p>
          </div>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              value={props.name}
              onChange={(event) => props.setName(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground">
                Date of birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={props.dateOfBirth}
                onChange={(event) => props.setDateOfBirth(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="gender" className="text-sm font-medium text-foreground">
                Gender
              </label>
              <input
                id="gender"
                name="gender"
                required
                value={props.gender}
                onChange={(event) => props.setGender(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="country" className="text-sm font-medium text-foreground">
                Country
              </label>
              <input
                id="country"
                name="country"
                required
                value={props.country}
                onChange={(event) => props.setCountry(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="race" className="text-sm font-medium text-foreground">
                Race
              </label>
              <input
                id="race"
                name="race"
                required
                value={props.race}
                onChange={(event) => props.setRace(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <label htmlFor="hobbies" className="text-sm font-medium text-foreground">
              Hobbies
            </label>
            <textarea
              id="hobbies"
              name="hobbies"
              required
              rows={3}
              value={props.hobbies}
              onChange={(event) => props.setHobbies(event.target.value)}
              className={cn(inputClassName, "h-auto min-h-[5.5rem] py-3")}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border/60 bg-surface/40 p-4">
        <h2 className="text-sm font-semibold text-foreground">Private contact details</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Required for account security. Never shown to other members — use chat and your @username instead.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="register-phone" className="text-sm font-medium text-foreground">
              Phone <span className="text-muted-foreground">(verified by SMS)</span>
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={props.phone}
              onChange={(event) => props.setPhone(event.target.value)}
              placeholder="+1 555 123 4567"
              className={inputClassName}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="telegram" className="text-sm font-medium text-foreground">
                Telegram <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="telegram"
                name="telegram"
                value={props.telegram}
                onChange={(event) => props.setTelegram(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="whatsApp" className="text-sm font-medium text-foreground">
                WhatsApp <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="whatsApp"
                name="whatsApp"
                value={props.whatsApp}
                onChange={(event) => props.setWhatsApp(event.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="zangi" className="text-sm font-medium text-foreground">
                Zangi <span className="text-muted-foreground">(optional)</span>
              </label>
              <input
                id="zangi"
                name="zangi"
                value={props.zangi}
                onChange={(event) => props.setZangi(event.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export { inputClassName as registerInputClassName };
