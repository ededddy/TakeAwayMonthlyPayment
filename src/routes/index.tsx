import { Show, createSignal } from "solid-js"
import { useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { getUser, logout } from "~/db/session";
import CreateForm from "~/components/CreateForm";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }
    return user;
  });
}

export default function Home() {
  const user = useRouteData<typeof routeData>();
  const [, { Form }] = createServerAction$((f: FormData, { request }) => logout(request));
  const [formType, setFormType] = createSignal("New", { equals: false });

  return (
    <main class="container-fluid">
      <div class="grid">
        <div class="grid">
          <h2>{user()?.username}</h2>
          <Form>
            <button name="logout" type="submit">
              Logout
            </button>
          </Form>
        </div>
        <div />
        <div />
        <div>
          <button name="newForm" onClick={() => setFormType("New")}>
            New Record
          </button>
        </div>
        <div>
          <button name="editForm" onClick={() => setFormType("Edit")}>
            Edit Record
          </button>
        </div>
      </div>
      <article style={{ "margin": "0 auto", "max-width": "90%" }}>
        <header>
          <hgroup>
            <h1>Takeaway Monthly Billing System</h1>
            <h2>{formType() === "New" ? "Create new record" : "Edit Record"}</h2>
          </hgroup>
        </header>
        <Show when={formType() === "New"}>
          <CreateForm />
        </Show>
        <Show when={formType() === "Edit"}>
        </Show>
      </article>
    </main>
  );
}
