import { Show } from "solid-js";
import { useParams, useRouteData } from "solid-start";
import { FormError } from "solid-start/data";
import {
  createServerAction$, createServerData$, redirect
} from "solid-start/server";
import { db } from "~/db";
import { createUserSession, getUser, login, register } from "~/db/session";

// ref: 
// https://stackoverflow.com/questions/19605150/regex-for-password-must-contain-at-least-eight-characters-at-least-one-number-a
const nameRe = /(?=.*?[#?!@$%^&*-])/g
const pwRe = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/g

function validateUsername(username: unknown) {
  console.log(nameRe.test(username as string));
  if (typeof username !== "string" || nameRe.test(username)) {
    return `Username must not contain special characters`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 13 || !pwRe.test(password)) {
    return `Password must be at least 13 characters long and contains at least special characters, nubmer, upper and lower characters`;
  }
}

export function routeData() {
  return createServerData$(async (_, { request }) => {
    if (await getUser(request)) {
      throw redirect("/");
    }
    return {};
  });
}

export default function Login() {
  const data = useRouteData<typeof routeData>();
  const params = useParams();

  const [loggingIn, { Form }] = createServerAction$(async (form: FormData) => {
    const loginType = form.get("loginType");
    const username = form.get("username");
    const password = form.get("password");
    const redirectTo = form.get("redirectTo") || "/";
    if (
      typeof loginType !== "string" ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof redirectTo !== "string"
    ) {
      throw new FormError(`Form not submitted correctly.`);
    }
    const fields = { loginType, username, password };
    const fieldErrors = {
      user: validateUsername(username),
      password: validatePassword(password),
    };
    if (Object.values(fieldErrors).some(Boolean)) {
      throw new FormError("Fields invalid", { fieldErrors, fields });
    }

    switch (loginType) {
      case "login": {
        const user = await login({ username, password });
        if (!user) {
          throw new FormError(`Username/Password incorrect`, {
            fields
          });
        }
        return createUserSession(`${user.id}`, redirectTo);
      }
      case "register": {
        const userExists = await db.user.findUnique({ where: { username } });
        if (userExists) {
          throw new FormError(`User with username ${username} already exists`, {
            fields
          });
        }
        const user = await register({ username, password });
        if (!user) {
          throw new FormError(`Something went wrong while registering.`, {
            fields
          });
        }
        return createUserSession(`${user.id}`, redirectTo);
      }
      default: {
        throw new FormError(`Login type invalid.`, { fields });
      }
    }
  });

  return (
    <main class="container-fluid">
      <article class="container" style={{ "padding": "2em", "border-radius": "15px" }}>
        <header>
          <h1 style={{ "margin": "0" }}>Login</h1>
        </header>
        <Form class="container">
          <input type="hidden" name="redirectTo" value={params.redirectTo ?? "/"} />
          <fieldset class="grid">
            <legend>Login or Register?</legend>
            <label>
              <input type="radio" name="loginType" value="login" checked={true} /> Login
            </label>
            <label>
              <input type="radio" name="loginType" value="register" /> Register
            </label>
          </fieldset>
          <div>
            <label for="username-input">Username</label>
            <input name="username" placeholder="your.username" aria-invalid={loggingIn.error?.fieldErrors?.username} />
          </div>
          <Show when={loggingIn.error?.fieldErrors?.username}>
            <p role="alert">{loggingIn.error.fieldErrors.username}</p>
          </Show>
          <div>
            <label for="password-input">Password</label>
            <input name="password" placeholder="P@ssw0rdOfLength13" aria-invalid={loggingIn.error?.fieldErrors?.username} />
          </div>
          <Show when={loggingIn.error?.fieldErrors?.password}>
            <p role="alert">{loggingIn.error.fieldErrors.password}</p>
          </Show>
          <Show when={loggingIn.error}>
            <p role="alert" id="error-message">
              {loggingIn.error.message}
            </p>
          </Show>
          <button type="submit">{data() ? "Login" : ""}</button>
          <footer style={{ "margin-top": "2em" }}>
            <label for="terms">
              <input type="checkbox" id="terms" name="terms" />
              I agree to the Terms and Conditions
            </label>
          </footer>
        </Form>
      </article>
    </main>
  );
}
