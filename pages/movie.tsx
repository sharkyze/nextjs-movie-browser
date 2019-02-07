import { useState, useEffect } from "react";
import { withRouter } from "next/router";
import Head from "next/head";

import Layout from "../src/components/Layout";
import { withNamespaces } from "../i18n";
import { apiTmdb } from "../src/services/apis";
import {
  TmdbMovieEntity,
  AppNextRootPageProps,
  AppNextRootPageGetInitialProps
} from "../src/@types";

type IComponentProps = AppNextRootPageProps & {
  data: TmdbMovieEntity;
  query: { id: string };
};

type IGetInitialProps = AppNextRootPageGetInitialProps & {
  query: { id: string };
};

/**
 * Returns Server Side rendered page on first load
 * Then the client will do the the request to the API and do the render
 */
const Movie = ({
  data,
  t,
  router,
  defaultLanguageFullCode
}: IComponentProps) => {
  /**
   * Keep a local version of the data from the API to retrigger API calls on:
   * - route change
   * - language change
   *
   * Note: If you don't need the client to make an API call with the new language
   * directly after updating the UI's language, you don't need this local state
   *
   * In order to make the UI reflect the new language with the API content,
   * I recall the static getInitialProps passing the arguments it is waiting for
   *
   * @todo prevent double firing of the API call (those are get requests which will be cached but still)
   */
  const [localData, setLocalData] = useState(data);
  useEffect(() => {
    const id = router.query && (router.query.id as string);
    if (id) {
      Movie.getInitialProps({
        defaultLanguageFullCode,
        query: { id: id }
      }).then(({ data }: { data: TmdbMovieEntity }) => setLocalData(data));
    }
  }, [defaultLanguageFullCode, router.query && router.query.id]); // -> here double firing of API call
  const { title, overview } = localData;
  return (
    <>
      <Head>
        <meta name="description" content={overview} />
      </Head>
      <Layout>
        <h2 dir="auto">{title}</h2>
        <h3>{t("movie-label-synopsis")}</h3>
        <p dir="auto">{overview}</p>
      </Layout>
    </>
  );
};

/**
 * Static method that will trigger a request to the API on route change
 * and pass the result as props to the render method.
 * This is called both on server and client route change.
 */
Movie.getInitialProps = async (
  props: IGetInitialProps
): Promise<{
  data: TmdbMovieEntity;
  server: boolean;
  namespacesRequired: string[];
}> => {
  const language = props.defaultLanguageFullCode;
  const data = await apiTmdb().movie(props.query.id, { language });
  return {
    data,
    server: !!props.req,
    namespacesRequired: ["movie", "common"]
  };
};

export default withNamespaces("movie")(withRouter(Movie));
