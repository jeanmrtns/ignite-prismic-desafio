import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { useState } from 'react';
import { format } from 'date-fns';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(
    postsPagination.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy'
        ).toLowerCase(),
      };
    })
  );

  async function loadMorePosts(): Promise<void> {
    const result = await fetch(nextPage).then(res => res.json());
    setNextPage(result.next_page);

    const newPosts = result.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy'
        ).toLowerCase(),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <main className={commonStyles.container}>
        <Header />
        <section className={styles.posts}>
          <ul>
            {posts.map(post => {
              return (
                <li className={styles.post} key={post.uid}>
                  <strong>
                    <Link href={`/post/${post.uid}`}>
                      <a>{post.data.title}</a>
                    </Link>
                  </strong>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.about}>
                    <time>
                      <FiCalendar />
                      {post.first_publication_date}
                    </time>
                    <div>
                      <FiUser />
                      {post.data.author}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {nextPage && (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    {
      pageSize: 1,
    }
  );

  const posts: Post[] = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
      first_publication_date: post.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
    },
  };
};
