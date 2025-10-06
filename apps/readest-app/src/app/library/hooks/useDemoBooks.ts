import { useEffect, useRef, useState } from 'react';

import { useEnv } from '@/context/EnvContext';
import { Book } from '@/types/book';
import { getUserLang, isValidURL } from '@/utils/misc';
import { isWebAppPlatform } from '@/services/environment';

import libraryEn from '@/data/demo/library.en.json';
import libraryZh from '@/data/demo/library.zh.json';

const libraries = {
  en: libraryEn,
  zh: libraryZh,
};

interface DemoBooks {
  library: string[];
}

const resolveDemoBookUrl = (url: string) => {
  if (isValidURL(url)) {
    return url;
  }

  if (typeof window !== 'undefined') {
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }

    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return `${window.location.origin}/${url.replace(/^\/+/, '')}`;
    }
  }

  return url;
};

export const useDemoBooks = () => {
  const { envConfig } = useEnv();
  const [books, setBooks] = useState<Book[]>([]);
  const isLoading = useRef(false);

  useEffect(() => {
    if (isLoading.current) return;
    isLoading.current = true;

    const userLang = getUserLang() as keyof typeof libraries;
    const fetchDemoBooks = async () => {
      try {
        const appService = await envConfig.getAppService();
        const demoBooks = libraries[userLang] || (libraries.en as DemoBooks);
        const books = await Promise.all(
          demoBooks.library.map((url) =>
            appService.importBook(resolveDemoBookUrl(url), [], false, true),
          ),
        );
        setBooks(books.filter((book) => book !== null) as Book[]);
      } catch (error) {
        console.error('Failed to import demo books:', error);
      }
    };

    const demoBooksFetchedFlag = localStorage.getItem('demoBooksFetched');
    if (isWebAppPlatform() && !demoBooksFetchedFlag) {
      fetchDemoBooks();
      localStorage.setItem('demoBooksFetched', 'true');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return books;
};
