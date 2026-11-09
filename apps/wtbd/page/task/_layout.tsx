import { layout } from "akanjs/client";

export default layout().render(({ children }) => {
  return <div className="min-h-screen">{children}</div>;
});
