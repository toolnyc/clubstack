"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { saveRider } from "@/lib/dj/rider-actions";
import type { TechnicalRider } from "@/types";

interface RiderFormProps {
  initialData?: TechnicalRider | null;
}

function RiderForm({ initialData }: RiderFormProps) {
  const router = useRouter();
  const eq = initialData?.equipment ?? {};

  const [cdjs, setCdjs] = useState(eq.cdjs ?? false);
  const [cdjModel, setCdjModel] = useState(eq.cdj_model ?? "");
  const [turntables, setTurntables] = useState(eq.turntables ?? false);
  const [turntableModel, setTurntableModel] = useState(
    eq.turntable_model ?? ""
  );
  const [mixer, setMixer] = useState(eq.mixer ?? false);
  const [mixerModel, setMixerModel] = useState(eq.mixer_model ?? "");
  const [needlesProvided, setNeedlesProvided] = useState(
    eq.needles_provided ?? false
  );
  const [usbRequired, setUsbRequired] = useState(eq.usb_required ?? false);
  const [laptopStand, setLaptopStand] = useState(eq.laptop_stand ?? false);
  const [otherEquipment, setOtherEquipment] = useState(eq.other ?? "");

  const [boothMonitors, setBoothMonitors] = useState(
    initialData?.booth_monitors ?? ""
  );
  const [boothRequirements, setBoothRequirements] = useState(
    initialData?.booth_requirements ?? ""
  );
  const [powerRequirements, setPowerRequirements] = useState(
    initialData?.power_requirements ?? ""
  );
  const [hospitality, setHospitality] = useState(
    initialData?.hospitality ?? ""
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await saveRider({
      equipment: {
        cdjs,
        cdj_model: cdjModel || undefined,
        turntables,
        turntable_model: turntableModel || undefined,
        mixer,
        mixer_model: mixerModel || undefined,
        needles_provided: needlesProvided,
        usb_required: usbRequired,
        laptop_stand: laptopStand,
        other: otherEquipment || undefined,
      },
      booth_monitors: boothMonitors || null,
      booth_requirements: boothRequirements || null,
      power_requirements: powerRequirements || null,
      hospitality: hospitality || null,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rider-form">
      <fieldset className="rider-form__section">
        <legend className="rider-form__section-title">Equipment</legend>

        <div className="rider-form__checkbox-group">
          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={cdjs}
              onChange={(e) => setCdjs(e.target.checked)}
            />
            <span>CDJs</span>
          </label>
          {cdjs && (
            <Input
              label="CDJ model"
              value={cdjModel}
              onChange={(e) => setCdjModel(e.target.value)}
              placeholder="e.g. CDJ-3000"
              optional
            />
          )}

          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={turntables}
              onChange={(e) => setTurntables(e.target.checked)}
            />
            <span>Turntables</span>
          </label>
          {turntables && (
            <Input
              label="Turntable model"
              value={turntableModel}
              onChange={(e) => setTurntableModel(e.target.value)}
              placeholder="e.g. Technics SL-1200MK7"
              optional
            />
          )}

          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={mixer}
              onChange={(e) => setMixer(e.target.checked)}
            />
            <span>Mixer</span>
          </label>
          {mixer && (
            <Input
              label="Mixer model"
              value={mixerModel}
              onChange={(e) => setMixerModel(e.target.value)}
              placeholder="e.g. Allen & Heath Xone:96"
              optional
            />
          )}

          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={needlesProvided}
              onChange={(e) => setNeedlesProvided(e.target.checked)}
            />
            <span>Needles provided by venue</span>
          </label>

          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={usbRequired}
              onChange={(e) => setUsbRequired(e.target.checked)}
            />
            <span>USB input required</span>
          </label>

          <label className="rider-form__checkbox">
            <input
              type="checkbox"
              checked={laptopStand}
              onChange={(e) => setLaptopStand(e.target.checked)}
            />
            <span>Laptop stand</span>
          </label>
        </div>

        <Input
          label="Other equipment"
          value={otherEquipment}
          onChange={(e) => setOtherEquipment(e.target.value)}
          placeholder="Any additional equipment needs"
          optional
        />
      </fieldset>

      <fieldset className="rider-form__section">
        <legend className="rider-form__section-title">Booth</legend>

        <Textarea
          label="Booth monitors"
          value={boothMonitors}
          onChange={(e) => setBoothMonitors(e.target.value)}
          placeholder="e.g. 2x KRK Rokit 8 or equivalent"
          optional
        />

        <Textarea
          label="Booth requirements"
          value={boothRequirements}
          onChange={(e) => setBoothRequirements(e.target.value)}
          placeholder="e.g. Enclosed booth, minimum 6ft x 4ft table"
          optional
        />
      </fieldset>

      <fieldset className="rider-form__section">
        <legend className="rider-form__section-title">
          Power & Hospitality
        </legend>

        <Textarea
          label="Power requirements"
          value={powerRequirements}
          onChange={(e) => setPowerRequirements(e.target.value)}
          placeholder="e.g. 2x grounded outlets within 6ft of booth"
          optional
        />

        <Textarea
          label="Hospitality"
          value={hospitality}
          onChange={(e) => setHospitality(e.target.value)}
          placeholder="e.g. Water, towels, green room access"
          optional
        />
      </fieldset>

      {error && <p className="rider-form__error">{error}</p>}

      <div className="rider-form__actions">
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? "Save changes" : "Save rider"}
        </Button>
      </div>

      {initialData && (
        <p className="rider-form__version">Version {initialData.version}</p>
      )}
    </form>
  );
}

export { RiderForm };
