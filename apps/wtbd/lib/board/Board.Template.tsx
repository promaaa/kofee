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
      <div className="grid grid-cols-2 gap-3">
        <Field.Number
          label={l("board.widthCm")}
          min={10}
          value={boardForm.widthCm}
          onChange={st.do.setWidthCmOnBoard}
        />
        <Field.Number
          label={l("board.heightCm")}
          min={10}
          value={boardForm.heightCm}
          onChange={st.do.setHeightCmOnBoard}
        />
        <Field.Number label={l("board.cols")} min={1} max={26} value={boardForm.cols} onChange={st.do.setColsOnBoard} />
        <Field.Number label={l("board.rows")} min={1} max={20} value={boardForm.rows} onChange={st.do.setRowsOnBoard} />
      </div>
    </Layout.Template>
  );
};
