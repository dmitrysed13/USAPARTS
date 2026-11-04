import { company } from "../content.ts";
import { Dialog } from "./Dialog.tsx";

type PrivacyDialogProps = {
  onClose: () => void;
};

export function PrivacyDialog({ onClose }: PrivacyDialogProps) {
  return (
    <Dialog title="Конфиденциальность" titleId="privacy-title" onClose={onClose} zClass="z-[80]">
      <div className="space-y-4 text-sm leading-relaxed text-mist">
        <p>
          {company.legalName} принимает заявки на подбор и доставку запчастей. В форме мы просим телефон и, если вы их
          указали, имя, марку, модель, год, название детали, VIN, OEM-номер, тип детали, удобное время звонка и
          комментарий.
        </p>
        <p>
          Заявка отправляется на {company.email}. Эти данные нужны, чтобы перезвонить, посчитать стоимость и оформить
          договор. Мы не продаём контакты и не используем их для рассылок, на которые вы не соглашались.
        </p>
        <p>
          Телефон и данные заказа могут получить только сотрудники, которые ведут заявку, а также служба доставки,
          когда груз уже едет к вам. Номер храним, пока идёт подбор и исполнение заказа, и удаляем по запросу, если
          закон этого не запрещает.
        </p>
        <p>
          Чтобы отозвать согласие или уточнить, какие данные у нас есть, напишите на {company.email} или позвоните{" "}
          {company.phoneDisplay}.
        </p>
      </div>
    </Dialog>
  );
}
