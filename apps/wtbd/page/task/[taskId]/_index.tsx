import { fetch, Task, usePage } from "@apps/wtbd/client";
import { jellyButtonRecipe } from "@apps/wtbd/ui";
import { ID } from "akanjs/base";
import { page } from "akanjs/client";
import { Link } from "akanjs/ui";

export default page()
  .param("taskId", ID)
  .render(({ taskId }) => {
    const { l } = usePage();
    const { taskView } = fetch.viewTask(taskId);
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/task" className={jellyButtonRecipe({ variant: "ghost", size: "sm" })}>
            {l("task.taskBackToTasks")}
          </Link>
          <Link href={`/task/${taskId}/edit`} className={jellyButtonRecipe({ variant: "primary", size: "sm" })}>
            {l("task.taskEdit")}
          </Link>
        </div>

        <Task.Zone.View className="max-w-2xl" view={taskView} />
      </main>
    );
  });
