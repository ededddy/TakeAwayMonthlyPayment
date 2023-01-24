import { createEffect, createSignal, onMount, on } from "solid-js";
import { A, useParams, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect } from "solid-start/server";
import OrderForm, { Fees } from "~/components/OrderForm";
import { db, Record, RecordPayload } from "~/db";
import { getUser, logout } from "~/db/session";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }
    return user;
  });
}

export default function RecordEdit() {
  const params = useParams();
  const user = useRouteData<typeof routeData>();
  const [, { Form }] = createServerAction$((f: FormData, { request }) => logout(request));
  const [record, setRecord] = createSignal({} as Record);
  const [modalPayload, setModal] = createSignal({} as Record);

  const fetcher = async (id: number) => {
    const rec = await db.record.getAsync({ data: { id } });
    if (rec == undefined)
      redirect("/404");
    setRecord(rec!);
  }

  const evtHandler = async (payload: RecordPayload) => {
    const payload_keys = Object.keys(payload);
    const unchangedFields = payload_keys.reduce((acc, cur) => {
      if (JSON.stringify(payload[cur]) === JSON.stringify(record()[cur]))
        return acc + 1
      return acc;
    }, 0);
    if (unchangedFields === payload_keys.length)
      return;
    const res = await db.record.update({
      data: {
        Id: Number(params.id), ...payload
      } as Record
    });
    setModal(res);
  }

  createEffect(on(modalPayload, async () => {
    await fetcher(Number(params.id));
  }));

  onMount(async () => {
    await fetcher(Number(params.id));
  });

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
            <A href="/" role="button">
              New Record
            </A>
          </li>
          <li>
            <A href="/edit" role="button">
              Back
            </A>
          </li>
        </ul>
      </nav>
      <article style={{ "margin": "0 auto", "max-width": "90%" }}>
        <header>
          <hgroup>
            <h1>Edit Record</h1>
            <h2>Edit submitted record</h2>
          </hgroup>
        </header>
        <OrderForm
          type="edit"
          participantList={record().participant_list}
          extraFees={
            {
              delivery: record().delivery_fee,
              reduction: record().reduction,
              service: record().service_fee,
              utensil: record().utensil_fee,
              packaging: record().packaging_fee,
            } as Fees
          }
          platform={record().platform}
          shopName={record().shop_name}
          submitEventHandler={evtHandler}
        />
      </article>
      <dialog
        id={`${modalPayload().Id}_${modalPayload().platform}}_${modalPayload().shop_name}`}
        open={modalPayload().Id !== undefined ? true : false}
      >
        <article>
          <header>
            <a href="#close" aria-label="Close" class="close"
              onClick={() => setModal({} as Record)}
            ></a>
            <h3>Order {modalPayload().Id}</h3>
          </header>
          <h5>
            <ins>Update successful.</ins>
          </h5>
        </article>
      </dialog>
    </main>
  )
}
