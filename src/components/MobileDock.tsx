type MobileDockProps = {
  onPick: () => void;
  onCallback: () => void;
};

export function MobileDock({ onPick, onCallback }: MobileDockProps) {
  return (
    <div className="dock fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md sm:hidden">
      <div className="grid grid-cols-2 gap-2 px-3 pt-3">
        <button type="button" className="btn btn-primary px-2 text-sm" onClick={onPick}>
          Подобрать запчасть
        </button>
        <button type="button" className="btn btn-ghost px-2 text-sm" onClick={onCallback}>
          Заказать звонок
        </button>
      </div>
    </div>
  );
}
