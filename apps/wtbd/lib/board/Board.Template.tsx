"use client";
import { st, usePage } from "@apps/wtbd/client";
import { Field, Layout } from "akanjs/ui";

interface GeneralProps {
  className?: string;
}

export const General = ({ className }: GeneralProps) => {
  const { l } = usePage();
  const boardForm = st.use.boardForm();
  return (
    <Layout.Template className={className}>
      <Field.Text label={l("board.name")} value={boardForm.name} onChange={st.do.setNameOnBoard} />
    </Layout.Template>
  );
};
