/*
 * CategorySelect.jsx — Category dropdown, built on Radix Select.
 *
 * Radix is used here rather than a native <select> because the menu has to be
 * styled to match the dark theme while keeping keyboard and screen-reader
 * behaviour intact. The option list mirrors HABIT_CATEGORIES in models.py.
 */

import * as Select from "@radix-ui/react-select";

export const HABIT_CATEGORIES = [
  "Health & Fitness",
  "Learning & Education",
  "Productivity",
  "Creativity",
  "Mindfulness",
  "Social",
  "Finance",
  "Other",
];

export default function CategorySelect({ value, onChange, id }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger className="select-trigger" id={id} aria-label="Category">
        <Select.Value />
        <Select.Icon className="select-chevron" aria-hidden="true">
          ⌄
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={6}>
          <Select.Viewport>
            {HABIT_CATEGORIES.map((category) => (
              <Select.Item key={category} value={category} className="select-item">
                <Select.ItemIndicator className="select-check" aria-hidden="true">
                  ✓
                </Select.ItemIndicator>
                <Select.ItemText>{category}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
