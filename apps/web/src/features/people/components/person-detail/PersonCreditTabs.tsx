import { getPersonModuleStyles } from "@/features/people/components/styles";
import {
  mediaTabLabelMap,
  roleTabLabelMap,
  type CreditMediaTab,
  type CreditRoleTab,
} from "./types";

type PersonCreditTabsProps = {
  styles: ReturnType<typeof getPersonModuleStyles>;
  mediaTab: CreditMediaTab;
  roleTab: CreditRoleTab;
  totalByMediaTab: Record<CreditMediaTab, number>;
  totalByRoleTab: Record<CreditRoleTab, number>;
  onMediaTabChange: (tab: CreditMediaTab) => void;
  onRoleTabChange: (tab: CreditRoleTab) => void;
};

export const PersonCreditTabs = ({
  styles,
  mediaTab,
  roleTab,
  totalByMediaTab,
  totalByRoleTab,
  onMediaTabChange,
  onRoleTabChange,
}: PersonCreditTabsProps) => {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(mediaTabLabelMap) as CreditMediaTab[]).map((tab) => (
          <button
            key={`person-media-tab-${tab}`}
            type="button"
            className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              borderColor: mediaTab === tab ? styles.accent : styles.borderSoft,
              color: mediaTab === tab ? styles.accent : styles.faint,
              background:
                mediaTab === tab
                  ? `color-mix(in srgb, ${styles.accent} 10%, transparent)`
                  : "transparent",
            }}
            onClick={() => onMediaTabChange(tab)}
          >
            {mediaTabLabelMap[tab]} ({totalByMediaTab[tab]})
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(roleTabLabelMap) as CreditRoleTab[]).map((tab) => (
          <button
            key={`person-role-tab-${tab}`}
            type="button"
            className="border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{
              borderColor: roleTab === tab ? styles.accent : styles.borderSoft,
              color: roleTab === tab ? styles.accent : styles.faint,
              background:
                roleTab === tab
                  ? `color-mix(in srgb, ${styles.accent} 10%, transparent)`
                  : "transparent",
            }}
            onClick={() => onRoleTabChange(tab)}
          >
            {roleTabLabelMap[tab]} ({totalByRoleTab[tab]})
          </button>
        ))}
      </div>
    </>
  );
};
