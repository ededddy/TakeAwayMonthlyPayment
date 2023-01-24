export type Participant = {
  id: number | undefined;
  username: string | undefined;
  price: number;
  validity?: {
    selection: string | undefined;
    price: string | undefined;
  };
}

export type User = {
  id: number;
  username: string;
  password: string
}

export type UserDto = {
  id: number;
  username: string;
}

interface IndexableRecord {
}

export type RecordPayload = {
  [key: string]: string | number | Participant[] | UserDto | Participant;
  host: UserDto;
  platform: string;
  shop_name: string;
  service_fee: number;
  packaging_fee: number;
  utensil_fee: number;
  delivery_fee: number;
  reduction: number;
  participant_list: Participant[];
  raw_total: number;
  total_fees: number;
  total_with_fees: number;
  reduced_total: number;
}

export interface Record extends RecordPayload {
  Id: number;
}

let users: User[] = [
  { id: 0, username: "admin", password: "Aaa123123123#$" },
  { id: 1, username: "saxon", password: "Aaa123123123#$" }
];

let records: Record[] = [
  {
    Id: 0,
    delivery_fee: 12,
    host: {
      id: 0,
      username: "admin"
    },
    packaging_fee: 1,
    participant_list: [
      { id: 0, username: 'admin', price: 123 }
    ],
    platform: "AoMi",
    raw_total: 123,
    reduced_total: 132,
    reduction: -5,
    service_fee: 0,
    shop_name: "mvq",
    total_fees: 14,
    total_with_fees: 137,
    utensil_fee: 1,
  },
  {
    Id: 1,
    delivery_fee: 12,
    host: {
      id: 0,
      username: "admin"
    },
    packaging_fee: 1,
    participant_list: [
      { id: 0, username: 'admin', price: 123 }
    ],
    platform: "mFood",
    raw_total: 123,
    reduced_total: 132,
    reduction: -5,
    service_fee: 0,
    shop_name: "mvq",
    total_fees: 14,
    total_with_fees: 137,
    utensil_fee: 1,
  }
];

export const db = {
  record: {
    async create({ data }: { data: RecordPayload }) {
      let rec = { ...data, Id: records.length };
      records.push(rec);
      return rec;
    },
    async findByUser({ data }: { data: UserDto }) {
      let recs = records.filter((e) => e.host.id === data.id);
      if (recs === null)
        recs = records.filter((e) => e.host.username === data.username);
      return recs;
    },
    async update({ data }: { data: Record }) {
      const target = records.findIndex((e) => e.Id === data.Id);
      records[target] = data;
      return records[target];
    },
    async getAsync({ data }: { data: { id: number } }) {
      return records.find((e) => e.Id === data.id);
    }
  },
  user: {
    async create({ data }: { data: { username: string, password: string } }) {
      let user = { ...data, id: users.length };
      users.push(user);
      return user;
    },
    async findUnique({ where: { username = undefined, id = undefined } }: { where: { username?: string; id?: number } }) {
      if (id !== undefined) {
        return users.find(user => user.id === id);
      } else {
        return users.find(user => user.username === username);
      }
    },
    async getListAsync() {
      return users.map(e => (e as UserDto));
    },
  }
}
