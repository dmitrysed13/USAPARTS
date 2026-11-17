"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { selectVehicleFromFormAction } from "@/modules/fitment/select-vehicle";

type Option = { value: string; label: string };

type Names = {
  brandName?: string;
  modelName?: string;
  generationName?: string;
  modificationName?: string;
};

async function loadOptions(params: Record<string, string>): Promise<{
  options: Option[];
  names?: Names;
}> {
  const query = new URLSearchParams(params);
  const response = await fetch(`/api/catalog/vehicle-options?${query.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    return { options: [] };
  }
  return (await response.json()) as { options: Option[]; names?: Names };
}

export function VehiclePicker({
  initial,
}: {
  initial?: {
    brandSlug?: string;
    modelSlug?: string;
    generationSlug?: string;
    modificationSlug?: string;
    engineSlug?: string;
    year?: string;
  };
}) {
  const brandId = useId();
  const modelId = useId();
  const generationId = useId();
  const yearId = useId();
  const modificationId = useId();
  const engineId = useId();

  const [brand, setBrand] = useState(initial?.brandSlug ?? "");
  const [model, setModel] = useState(initial?.modelSlug ?? "");
  const [generation, setGeneration] = useState(initial?.generationSlug ?? "");
  const [year, setYear] = useState(initial?.year ?? "");
  const [modification, setModification] = useState(initial?.modificationSlug ?? "");
  const [engine, setEngine] = useState(initial?.engineSlug ?? "");
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [generations, setGenerations] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [modifications, setModifications] = useState<Option[]>([]);
  const [engines, setEngines] = useState<Option[]>([]);
  const [names, setNames] = useState<Names>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    void loadOptions({}).then((payload) => {
      if (!controller.signal.aborted) {
        setBrands(payload.options);
      }
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!brand) {
      return;
    }
    const controller = new AbortController();
    void loadOptions({ brand }).then((payload) => {
      if (controller.signal.aborted) {
        return;
      }
      setModels(payload.options);
      setNames((prev) => ({ ...prev, brandName: payload.names?.brandName }));
    });
    return () => controller.abort();
  }, [brand]);

  useEffect(() => {
    if (!brand || !model) {
      return;
    }
    const controller = new AbortController();
    void loadOptions({ brand, model }).then((payload) => {
      if (controller.signal.aborted) {
        return;
      }
      setGenerations(payload.options);
      setNames((prev) => ({
        ...prev,
        brandName: payload.names?.brandName ?? prev.brandName,
        modelName: payload.names?.modelName,
      }));
    });
    return () => controller.abort();
  }, [brand, model]);

  useEffect(() => {
    if (!brand || !model || !generation) {
      return;
    }
    const controller = new AbortController();
    void loadOptions({ brand, model, generation }).then((payload) => {
      if (controller.signal.aborted) {
        return;
      }
      const looksLikeYears =
        payload.options.length > 0 && /^\d{4}$/.test(payload.options[0]?.value ?? "");
      if (looksLikeYears) {
        setYears(payload.options);
        setModifications([]);
      } else {
        setYears([]);
        setModifications(payload.options);
      }
      setNames((prev) => ({ ...prev, ...payload.names }));
    });
    return () => controller.abort();
  }, [brand, model, generation]);

  useEffect(() => {
    if (!brand || !model || !generation || !year) {
      return;
    }
    const controller = new AbortController();
    void loadOptions({ brand, model, generation, year }).then((payload) => {
      if (controller.signal.aborted) {
        return;
      }
      setModifications(payload.options);
      setNames((prev) => ({ ...prev, ...payload.names }));
    });
    return () => controller.abort();
  }, [brand, model, generation, year]);

  useEffect(() => {
    if (!brand || !model || !generation || !modification) {
      return;
    }
    const controller = new AbortController();
    void loadOptions({ brand, model, generation, modification }).then((payload) => {
      if (controller.signal.aborted) {
        return;
      }
      setEngines(payload.options);
      setNames((prev) => ({ ...prev, ...payload.names }));
    });
    return () => controller.abort();
  }, [brand, model, generation, modification]);

  const visibleModels = useMemo(() => (brand ? models : []), [brand, models]);
  const visibleGenerations = useMemo(
    () => (model ? generations : []),
    [model, generations],
  );
  const visibleYears = useMemo(
    () => (generation ? years : []),
    [generation, years],
  );
  const visibleModifications = useMemo(
    () => (generation ? modifications : []),
    [generation, modifications],
  );
  const visibleEngines = useMemo(
    () => (modification ? engines : []),
    [modification, engines],
  );

  const brandName = useMemo(
    () => names.brandName ?? brands.find((item) => item.value === brand)?.label,
    [names.brandName, brands, brand],
  );
  const modelName = useMemo(
    () => names.modelName ?? visibleModels.find((item) => item.value === model)?.label,
    [names.modelName, visibleModels, model],
  );
  const generationName = useMemo(
    () =>
      names.generationName ??
      visibleGenerations.find((item) => item.value === generation)?.label,
    [names.generationName, visibleGenerations, generation],
  );
  const modificationName = useMemo(
    () =>
      names.modificationName ??
      visibleModifications.find((item) => item.value === modification)?.label,
    [names.modificationName, visibleModifications, modification],
  );
  const engineName = visibleEngines.find((item) => item.value === engine)?.label;

  function onSubmit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      await selectVehicleFromFormAction(formData);
      setMessage("Автомобиль сохранён в сессии. Можно искать запчасти под него.");
    });
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-4 rounded-2xl border border-line bg-surface p-5"
    >
      <div>
        <h2 className="font-display text-xl font-semibold">Выбор автомобиля</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Марка → модель → поколение → год → модификация → двигатель. Выбор сохраняется в
          cookie сессии.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field htmlFor={brandId} label="Марка">
          <select
            className={controlClassName}
            id={brandId}
            name="brandSlug"
            onChange={(event) => {
              setBrand(event.target.value);
              setModel("");
              setGeneration("");
              setYear("");
              setModification("");
              setEngine("");
              setModels([]);
              setGenerations([]);
              setYears([]);
              setModifications([]);
              setEngines([]);
            }}
            required
            value={brand}
          >
            <option value="">Выберите</option>
            {brands.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor={modelId} label="Модель">
          <select
            className={controlClassName}
            disabled={!brand}
            id={modelId}
            name="modelSlug"
            onChange={(event) => {
              setModel(event.target.value);
              setGeneration("");
              setYear("");
              setModification("");
              setEngine("");
              setGenerations([]);
              setYears([]);
              setModifications([]);
              setEngines([]);
            }}
            value={model}
          >
            <option value="">Выберите</option>
            {visibleModels.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor={generationId} label="Поколение">
          <select
            className={controlClassName}
            disabled={!model}
            id={generationId}
            name="generationSlug"
            onChange={(event) => {
              setGeneration(event.target.value);
              setYear("");
              setModification("");
              setEngine("");
              setYears([]);
              setModifications([]);
              setEngines([]);
            }}
            value={generation}
          >
            <option value="">Выберите</option>
            {visibleGenerations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        {visibleYears.length > 0 ? (
          <Field htmlFor={yearId} label="Год">
            <select
              className={controlClassName}
              disabled={!generation}
              id={yearId}
              name="year"
              onChange={(event) => {
                setYear(event.target.value);
                setModification("");
                setEngine("");
                setModifications([]);
                setEngines([]);
              }}
              value={year}
            >
              <option value="">Любой</option>
              {visibleYears.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        <Field htmlFor={modificationId} label="Модификация">
          <select
            className={controlClassName}
            disabled={!generation || (visibleYears.length > 0 && !year)}
            id={modificationId}
            name="modificationSlug"
            onChange={(event) => {
              setModification(event.target.value);
              setEngine("");
              setEngines([]);
            }}
            value={modification}
          >
            <option value="">Выберите</option>
            {visibleModifications.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor={engineId} label="Двигатель">
          <select
            className={controlClassName}
            disabled={!modification}
            id={engineId}
            name="engineSlug"
            onChange={(event) => setEngine(event.target.value)}
            value={engine}
          >
            <option value="">Выберите</option>
            {visibleEngines.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {brandName ? (
        <input name="brandName" type="hidden" value={brandName} />
      ) : null}
      {modelName ? <input name="modelName" type="hidden" value={modelName} /> : null}
      {generationName ? (
        <input name="generationName" type="hidden" value={generationName} />
      ) : null}
      {modificationName ? (
        <input name="modificationName" type="hidden" value={modificationName} />
      ) : null}
      {engineName ? <input name="engineName" type="hidden" value={engineName} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={buttonClassName("primary")}
          disabled={!brand || pending}
          type="submit"
        >
          {pending ? "Сохраняем…" : "Сохранить автомобиль"}
        </button>
        {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
      </div>
    </form>
  );
}
