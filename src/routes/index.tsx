import { Show, createSignal } from "solid-js"
import { A, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { getUser, logout } from "~/db/session";
import OrderForm from "~/components/OrderForm";
import { db, Record, RecordPayload } from "~/db";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }
    return user;
  });
}

export type ModalPayload = { id: number; platform: string; shop_name: string };

export default function Home() {
  const user = useRouteData<typeof routeData>();
  const [, { Form }] = createServerAction$((f: FormData, { request }) => logout(request));
  const [formType, setFormType] = createSignal("New", { equals: false });
  const [modalPayload, setModal] = createSignal({} as Record);
  const evtHandler = async (payload: RecordPayload) => {
    const res = await db.record.create({ data: payload });
    setModal(res);
  }

  return (
    <main class="container-fluid">
      <nav>
        <ul>
          <li><h2 style={{ "margin": "0" }}>{user()?.username}</h2></li>
          <li>
            <Form style={{ "margin": "0" }}>
              <button name="logout" type="submit">
                Logout
              </button>
            </Form>
          </li>
        </ul>
        <ul>
          <li>
            <A href="#" role="button" class="container-fluid" onClick={() => setFormType("New")}>
              New Record
            </A>
          </li>
          <li>
            <A href="/edit" role="button">
              Edit Record
            </A>
          </li>
        </ul>
      </nav>
      <article style={{ "margin": "0 auto", "max-width": "90%" }}>
        <header>
          <hgroup>
            <h1>Takeaway Monthly Billing System</h1>
            <h2>{formType() === "New" ? "Create new record" : "Welcome!"}</h2>
          </hgroup>
        </header>
        <Show when={formType() === "New"}>
          <OrderForm submitEventHandler={evtHandler} />
        </Show>
      </article>
      <dialog
        id={`${modalPayload().Id}_${modalPayload().platform}}_${modalPayload().shop_name}`}
        open={modalPayload()?.Id ? true : false}
      >
        <article>
          <header>
            <a href="#close" aria-label="Close" class="close"
              onClick={() => setModal({} as Record)}
            ></a>
            <h3>Order : {modalPayload().Id}</h3>
          </header>
          <h5>Ordered from
            <kbd>
              {modalPayload().shop_name}
            </kbd>
            on
            <kbd>
              {modalPayload().platform}
            </kbd>
          </h5>
        </article>
      </dialog>
    </main >
  );
}
