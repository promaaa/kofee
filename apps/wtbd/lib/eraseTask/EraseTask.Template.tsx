"use client";
import { st, usePage } from "@apps/wtbd/client";
import { Field, Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}

export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const eraseTaskForm = st.use.eraseTaskForm();
  return (
    <Layout.Template className={className}>
      <Field.Text label={l("eraseTask.name")} value={eraseTaskForm.name} onChange={st.do.setNameOnEraseTask} />
    </Layout.Template>
  );
};
