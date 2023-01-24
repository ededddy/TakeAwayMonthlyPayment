import { createSignal, createEffect, For } from "solid-js";
import { A, useRouteData } from "solid-start";
import { createServerAction$, createServerData$, redirect } from "solid-start/server";
import { getUser, logout } from "~/db/session";
import { Record, UserDto, db } from "~/db";

export function routeData() {
  return createServerData$(async (_, { request }) => {
    const user = await getUser(request);

    if (!user) {
      throw redirect("/login");
    }
    return user;
  });
}

async function getOrders(user: UserDto) {
  const userRecords = await db.record.findByUser({ data: user });
  return userRecords
}

export default function EditHome() {
  const user = useRouteData<typeof routeData>();
  const [, { Form }] = createServerAction$((f: FormData, { request }) => logout(request));
  const [userRecords, setUserRecords] = createSignal([] as Record[]);

  createEffect(async () => {
    setUserRecords(await getOrders(user()!));
  })

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
              Edit Record
            </A>
          </li>
        </ul>
      </nav>
      <article style={{ "margin": "0 auto", "max-width": "90%" }}>
        <header>
          <hgroup>
            <h1>Edit</h1>
            <h2>Edit submitted record</h2>
          </hgroup>
        </header>
        <For each={userRecords()}>
          {(item, index) => {
            return (
              <details id={`order-${item.Id}-${index()}`}>
                <summary role="button" class="contrast">
                  <A style={{ "margin-right": "1.25em", "padding": "5px 15px" }} href={`/edit/${item.Id}/`} role="button" class="outline">
                    Edit
                  </A>
                  Order {item.Id} - {item.platform}  {item.shop_name}
                </summary>
                <h4>Participants</h4>
                <ul>
                  <For each={item.participant_list}>
                    {(subitem) => {
                      return (
                        <li>{subitem.username}</li>
                      )
                    }}
                  </For>
                </ul>
              </details>
            );
          }}
        </For>
      </article>
    </main >
  );
}
