import Link from "next/link";
import { sectionsInGroup } from "./staff-nav-groups";
import type { StaffNavGroup, StaffNavSection } from "./staff-shell.types";
import {
  STAFF_NAV_ROW_ACTIVE,
  STAFF_NAV_ROW_BASE,
  STAFF_NAV_ROW_IDLE,
  STAFF_ON_ORANGE_FOCUS,
  STAFF_SUB_LINK_ACTIVE,
  STAFF_SUB_LINK_BASE,
  STAFF_SUB_LINK_IDLE,
  staffLabelClass,
  staffTreeClass,
} from "./staff-ui";

type StaffNavGroupsProps = {
  groups: StaffNavGroup[];
  sections: StaffNavSection[];
  active: string;
  selectedGroup: string;
  groupBadges: Record<string, number>;
  badges?: Partial<Record<string, number>>;
  collapsed: boolean;
  onSelectGroup: (groupId: string) => void;
  onNavigate: () => void;
};

// Group rows of the sidebar. The selected group opens its sections as a
// tree beneath it: a vertical guide that bends into each link, and the last
// link's guide stops at its bend. On the collapsed desktop rail the rows show
// icons only and the tree folds closed.
export function StaffNavGroups({
  groups,
  sections,
  active,
  selectedGroup,
  groupBadges,
  badges,
  collapsed,
  onSelectGroup,
  onNavigate,
}: StaffNavGroupsProps) {
  const labelHidden = collapsed ? "md:hidden" : "";
  const rowCollapsed = collapsed ? "md:justify-center md:px-0" : "";

  return (
    <ul className="flex flex-col gap-1">
      {groups.map((group) => {
        const Icon = group.icon;
        const selected = group.id === selectedGroup;
        const pending = groupBadges[group.id] ?? 0;
        const items = sectionsInGroup(sections, group.id);
        return (
          <li key={group.id}>
            <button
              type="button"
              onClick={() => onSelectGroup(group.id)}
              aria-expanded={selected}
              aria-label={
                pending > 0 ? `${group.label}, ${pending} mục chờ` : group.label
              }
              title={group.label}
              className={`${STAFF_NAV_ROW_BASE} relative ${rowCollapsed} ${
                selected ? STAFF_NAV_ROW_ACTIVE : STAFF_NAV_ROW_IDLE
              } ${STAFF_ON_ORANGE_FOCUS}`}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className={`flex-1 ${staffLabelClass(collapsed)}`}>
                {group.label}
              </span>
              {pending > 0 && (
                <span
                  aria-hidden="true"
                  className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                    selected
                      ? "bg-[#FB923C] text-[#111111]"
                      : "bg-[#111111] text-white"
                  } ${labelHidden}`}
                >
                  {pending}
                </span>
              )}
              {pending > 0 && !selected && (
                <span
                  aria-hidden="true"
                  className={`absolute top-1.5 right-1.5 hidden h-2.5 w-2.5 rounded-full border-2 border-[#FB923C] bg-[#111111] ${
                    collapsed ? "md:block" : ""
                  }`}
                />
              )}
            </button>

            <div className={`mt-1 ml-3 ${staffTreeClass(collapsed)}`}>
              <ul
                className={`flex min-h-0 flex-col gap-1 overflow-hidden pr-1 pl-3 ${
                  collapsed ? "md:pointer-events-none" : ""
                }`}
              >
                {items.map((section, index) => {
                  const current = section.id === active;
                  const badge = badges?.[section.id] ?? 0;
                  const last = index === items.length - 1;
                  return (
                    <li key={section.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-3 top-0 h-1/2 w-3 rounded-bl-xl border-b border-l border-[#111111]/25"
                      />
                      {!last && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-3 top-1/2 -bottom-1 w-3 border-l border-[#111111]/25"
                        />
                      )}
                      <Link
                        href={section.href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={`${STAFF_SUB_LINK_BASE} ${
                          current ? STAFF_SUB_LINK_ACTIVE : STAFF_SUB_LINK_IDLE
                        } ${STAFF_ON_ORANGE_FOCUS}`}
                      >
                        <span className="min-w-0 flex-1">{section.label}</span>
                        {badge > 0 && (
                          <span
                            aria-hidden="true"
                            className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#111111] px-1.5 text-xs font-bold text-white"
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
