import { createSignal, createEffect, For, Show, on, onMount } from "solid-js";
import { useRouteData } from "solid-start";
import { db, RecordPayload, Participant, UserDto } from "~/db";
import { routeData } from "~/routes";

import { ImCross } from 'solid-icons/im'

export type SelectableUser = {
  id: number;
  username: string;
  isSelected: boolean;
}

export type PreFlightValidations = {
  selection: string | undefined
  price: string | undefined
}

export type Fees = {
  packaging: number;
  utensil: number;
  service: number;
  delivery: number;
  reduction: number;
}

async function getOtherUsers(selfUser: UserDto) {
  const users = await db.user.getListAsync();
  return users.filter((e) => e !== selfUser);
}

export default function OrderForm(props: any) {
  const user = useRouteData<typeof routeData>();

  const [participantList, setParticipantList] = createSignal([{ id: undefined, username: undefined, price: 0 }] as Participant[])

  const [otherUsers, setOtherUsers] = createSignal([] as SelectableUser[]);

  const [preFlightValidations, setPreFlightValidations] = createSignal({ selection: "Fill out the form first." } as PreFlightValidations);

  const [extraFees, setExtraFees] = createSignal({ delivery: 0, packaging: 0, service: 0, utensil: 0, reduction: 0 } as Fees);

  const [platform, setPlatform] = createSignal("mFood");
  const [shopName, setShopName] = createSignal("");

  createEffect(() => {
    if (props.type === "edit")
      setPreFlightValidations({ selection: undefined, price: undefined } as PreFlightValidations);
    if (props.participantList !== undefined) {
      setParticipantList([...props.participantList]);
    }
    if (props.extraFees !== undefined) {
      setExtraFees({ ...props.extraFees });
    }
    if (props.platform !== undefined) {
      setPlatform(props.platform);
    }
    if (props.shopName !== undefined) {
      setShopName(props.shopName);
    }
  })

  const resetSignals = () => {
    setParticipantList([{ id: undefined, username: undefined, price: 0 }]);
    setPlatform("mFood");
    setShopName("");
    setExtraFees({ delivery: 0, packaging: 0, service: 0, utensil: 0, reduction: 0 } as Fees);
    setPreFlightValidations({ selection: "Fill out the form first." } as PreFlightValidations);
  }

  createEffect(on(participantList, async () => {
    let otherUsers = await getOtherUsers(user()!);
    setOtherUsers(otherUsers!.map((e) => {
      return { ...e, isSelected: false };
    }));
  }));

  return (
    <>
      <div>
        <button type="submit"
          onClick={async () => {
            var total_fees = (extraFees().delivery + extraFees().service + extraFees().utensil + extraFees().packaging);
            var raw_total = participantList().reduce((acc, cur) => acc += cur.price, 0);
            var payload: RecordPayload = {
              host: ({ id: user()?.id, username: user()?.username } as UserDto),
              platform: platform(),
              shop_name: shopName(),
              service_fee: extraFees().service,
              utensil_fee: extraFees().utensil,
              packaging_fee: extraFees().packaging,
              delivery_fee: extraFees().delivery,
              reduction: extraFees().reduction,
              participant_list: participantList(),
              raw_total,
              total_fees,
              total_with_fees: raw_total + total_fees,
              reduced_total: raw_total + total_fees + extraFees().reduction,
            };
            await props.submitEventHandler(payload);
            if (props.type !== 'edit')
              resetSignals();
          }}
          disabled={!!preFlightValidations()?.selection || !!preFlightValidations()?.price}>
          Submit
        </button>
        <Show when={preFlightValidations()?.selection}>
          <p style={{ "color": "red" }} role="alert"> {preFlightValidations().selection}</p>
        </Show>
        <Show when={preFlightValidations()?.price}>
          <p style={{ "color": "red" }} role="alert"> {preFlightValidations().price}</p>
        </Show>
      </div>
      <hgroup>
        <h2>Platform</h2>
        <h3>Order platform</h3>
      </hgroup>
      <div class="grid">
        <div>
          <label for="platform">Platform</label>
          <select id="platform" onChange={(e) => setPlatform((e.target as HTMLInputElement).value)}>
            <option value="mFood" selected={platform() === "mFood"}>mFood</option>
            <option value="AoMi" selected={platform() === "AoMi"}>Ao Mi</option>
          </select>
        </div>
        <div>
          <label for="shopname">Shop Name</label>
          <input name="shopname" type="text" value={shopName()} onChange={(e) => setShopName((e.target as HTMLInputElement).value)} />
        </div>
      </div>
      <hgroup>
        <h2>Extra Fees</h2>
        <h3>Extra Fees for this order</h3>
      </hgroup>
      <div class="grid">
        <div>
          <label for="delivery">Delivery</label>
          <input
            type="number" id="delivery" name="delivery"
            value={extraFees().delivery}
            onChange={(e) => setExtraFees({ ...extraFees(), delivery: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
        <div>
          <label for="packaing">Packaing</label>
          <input
            type="number" id="packaing" name="packaing"
            value={extraFees().packaging}
            onChange={(e) => setExtraFees({ ...extraFees(), packaging: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
        <div>
          <label for="utensil">Utensil</label>
          <input type="number" id="utensil" name="utensil"
            value={extraFees().utensil}
            onChange={(e) => setExtraFees({ ...extraFees(), utensil: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
        <div>
          <label for="service">Service</label>
          <input type="number" id="service" name="service"
            value={extraFees().service}
            onChange={(e) => setExtraFees({ ...extraFees(), service: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
        <div>
          <label for="reduction">Reduction</label>
          <input type="number" id="reduction" name="reduction"
            value={extraFees().reduction}
            onChange={(e) => setExtraFees({ ...extraFees(), reduction: Number((e.target as HTMLInputElement).value) })}
          />
          <p>*Please input Negative number</p>
        </div>
      </div>
      <hgroup>
        <h2>Participants</h2>
        <h3>Participants for this order</h3>
      </hgroup>
      <For each={participantList()}>
        {(item, index) => {
          return (
            <div class="container-fluid"
              style={{
                "display": "flex",
                "justify-items": "center",
                "align-items": "start",
              }}>
              <div style={{ "width": "45%", "margin": "0 1em" }}>
                <label for={`_${index()}_selection`}>Participant</label>
                <select id={`_${index()}_selection`}
                  onChange={(e) => {
                    setParticipantList(
                      participantList().map((p, idx) => {
                        if (idx === index()) {
                          const target = otherUsers().find(o => o.id === Number((e.target as HTMLInputElement).value));
                          const dup = participantList().find(o => o.id === Number((e.target as HTMLInputElement).value));
                          setPreFlightValidations({
                            selection: dup
                              ? "Selection violation detected"
                              : (e.target as HTMLInputElement).value === undefined
                                ? "Has incomplete fields, please check the form"
                                : undefined,
                            price: p.price < 0 ? "Negative amount detected" : undefined
                          });
                          return {
                            id: target?.id,
                            username: target?.username,
                            price: p.price,
                            validity: {
                              selection: dup ? "This user has been selected twice" : undefined,
                              price: p.price < 0 ? "Negative amount?" : undefined
                            }
                          }
                        }
                        return { ...p };
                      })
                    );
                  }}
                >
                  <option value="-1"> Select </option>
                  <For each={otherUsers()}>
                    {
                      (otherUser) => (
                        <option value={otherUser.id}
                          selected={otherUser.id === item.id}>
                          {otherUser.username}
                        </option>
                      )
                    }
                  </For>
                </select>
                <Show when={item.validity?.selection}>
                  <p style={{ "color": "red" }} role="alert">{item.validity?.selection}</p>
                </Show>
                <Show when={item.id === undefined}>
                  <p style={{ "color": "red" }} role="alert">You must select a participant</p>
                </Show>
              </div>
              <div style={{ "width": "45%", "margin": "0 1em" }}>
                <label for="">Price</label>
                <input
                  id={`${item.id}_${index}_price`}
                  value={item.price}
                  type="number"
                  step="0.01"
                  onChange={(e) => {
                    setParticipantList(
                      participantList().map((p, idx) => {
                        if (idx == index()) {
                          setPreFlightValidations((prev) => {
                            return {
                              selection: prev.selection,
                              price: Number((e.target as HTMLInputElement).value) < 0 ? "Negative amount detected" : undefined
                            }
                          });
                          return {
                            ...p,
                            price: Number((e.target as HTMLInputElement).value),
                            validity: {
                              selection: p.validity ? p.validity.selection : undefined,
                              price: Number((e.target as HTMLInputElement).value) < 0 ? "Negative amount?" : undefined
                            }
                          }
                        }
                        return { ...p }
                      })
                    )
                  }}
                />
                <Show when={item.validity?.price}>
                  <p style={{ "color": "red" }} role="alert">{item.validity?.price}</p>
                </Show>
              </div>
              <div style={{ "flex": "-1", "margin": "0 auto", "cursor": "pointer" }}
                onClick={() => {
                  setParticipantList(
                    participantList().filter((_, idx) => idx !== index())
                  );

                  setPreFlightValidations((prev) => {
                    return {
                      selection: participantList().length === 0
                        ? "0 Participants for this order."
                        : undefined,
                      price: prev.price,
                    }
                  })
                }}>
                <ImCross class="container-fluid" size={24} />
              </div>
            </div>
          )
        }}
      </For>
      <button class="contrast"
        onClick={() => {
          setParticipantList(
            [
              ...participantList(),
              { id: undefined, username: undefined, price: 0 }
            ]);
          setPreFlightValidations((prev) => {
            return {
              selection: "Has incomplete fields, please check the form",
              price: prev.price
            }
          });
        }}
      >
        Add Participant
      </button>
    </>
  );
}
