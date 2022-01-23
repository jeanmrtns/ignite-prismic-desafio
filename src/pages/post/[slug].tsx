import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post: serverPost }: PostProps): JSX.Element {
  const post = {
    ...serverPost,
    first_publication_date: format(
      new Date(serverPost.first_publication_date),
      'dd MMM yyyy'
    ).toLowerCase(),
  };

  const router = useRouter();

  const [readTime, setReadTime] = useState(0);

  useEffect(() => {
    const words = post.data.content.reduce((acc, p) => {
      const hwords = p.heading.split(' ').length;
      const bwords = p.body.reduce((accumulator, b) => {
        const size = b.text.split(' ').length;
        return accumulator + size;
      }, 0);

      return hwords + bwords + acc;
    }, 0);

    setReadTime(Math.ceil(words / 200));
  }, [post.data.content]);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="" />
      <main className={commonStyles.container}>
        <section className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.about}>
            <time>
              <FiCalendar />
              {post.first_publication_date}
            </time>
            <div>
              <FiUser />
              {post.data.author}
            </div>
            <time>
              <FiClock />
              {readTime} min
            </time>
          </div>
          {post.data.content.map(c => {
            return (
              <article key={c.heading}>
                <h2>{c.heading}</h2>
                <div
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: RichText.asHtml(c.body) }}
                />
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts')
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: [...paths],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'posts',
    context.params.slug as string,
    {}
  );

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(c => {
        return {
          heading: c.heading,
          body: [...c.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
