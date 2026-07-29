import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.favorite.deleteMany();
  await prisma.songFact.deleteMany();
  await prisma.song.deleteMany();
  await prisma.band.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@songfacts.com',
      password: hashedPassword,
    },
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@songfacts.com',
      password: hashedPassword,
    },
  });

  console.log('✅ Users created');

  const bands = await Promise.all([
    prisma.band.create({
      data: {
        name: 'Dewa 19',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 1986,
        genres: ['Indonesian Pop', 'Rock', 'Alternative'],
        description: 'Dewa 19 adalah band rock legendaris Indonesia yang didirikan oleh Ahmad Dhani.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Sheila on 7',
        image: 'https://i.scdn.co/image/ab6761610000e5eb7ecf6e8c0b4a1c4a2b7f0f0',
        formedYear: 1996,
        genres: ['Indonesian Pop', 'Rock Pop'],
        description: 'Sheila on 7 adalah band pop rock Indonesia yang sangat populer di akhir 90-an.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Peterpan',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2000,
        genres: ['Indonesian Pop', 'Alternative Rock'],
        description: 'Peterpan (kemudian NOAH) adalah band pop rock Indonesia yang didirikan di Bandung.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Nike Ardilla',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 1990,
        genres: ['Indonesian Pop', 'Rock'],
        description: 'Nike Ardilla adalah penyanyi rock Indonesia yang legendaris.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Iwan Fals',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 1979,
        genres: ['Indonesian Pop', 'Folk Rock'],
        description: 'Iwan Fals adalah penyanyi dan pencipta lagu Indonesia yang sangat berpengaruh.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Kangen Band',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2005,
        genres: ['Indonesian Pop', 'Dangdut Pop'],
        description: 'Kangen Band adalah grup musik pop Indonesia dari Lampung.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Nidji',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2002,
        genres: ['Indonesian Pop', 'Alternative'],
        description: 'Nidji adalah grup musik pop alternatif Indonesia.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Armada',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2007,
        genres: ['Indonesian Pop', 'Pop Rock'],
        description: 'Armada adalah grup musik pop rock Indonesia.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Virgoun',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2010,
        genres: ['Indonesian Pop', 'Pop'],
        description: 'Virgoun adalah penyanyi solo Indonesia yang dikenal dari Last Child.',
      },
    }),
    prisma.band.create({
      data: {
        name: 'Tulus',
        image: 'https://i.scdn.co/image/ab6761610000e5eb6e2e0b014d2db6b4a2b7f0f0',
        formedYear: 2011,
        genres: ['Indonesian Pop', 'Jazz Pop'],
        description: 'Tulus adalah penyanyi solo Indonesia yang dikenal dengan musiknya yang puitis.',
      },
    }),
  ]);

  console.log('✅ Bands created');

  const songs = await Promise.all([
    prisma.song.create({
      data: {
        title: 'Pupus',
        artist: 'Dewa 19',
        album: 'Bintang Lima',
        youtubeId: 'GOSUdXzUhqA',
        albumCover: 'https://img.youtube.com/vi/GOSUdXzUhqA/maxresdefault.jpg',
        duration: 265,
        genres: ['Indonesian Pop', 'Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Kangen',
        artist: 'Dewa 19',
        album: 'Terbaik-Terbaik',
        youtubeId: 'VhJgD1LiQKk',
        albumCover: 'https://img.youtube.com/vi/VhJgD1LiQKk/maxresdefault.jpg',
        duration: 291,
        genres: ['Indonesian Pop', 'Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Dan',
        artist: 'Sheila on 7',
        album: 'Sheila on 7',
        youtubeId: '7rYrZ15CzqQ',
        albumCover: 'https://img.youtube.com/vi/7rYrZ15CzqQ/maxresdefault.jpg',
        duration: 274,
        genres: ['Indonesian Pop', 'Rock Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Hari Bersamanya',
        artist: 'Sheila on 7',
        album: 'Kisah Klasik',
        youtubeId: 'qSR7S0VvK0Q',
        albumCover: 'https://img.youtube.com/vi/qSR7S0VvK0Q/maxresdefault.jpg',
        duration: 301,
        genres: ['Indonesian Pop', 'Rock Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Mungkin Nanti',
        artist: 'Peterpan',
        album: 'Bintang di Surga',
        youtubeId: '0yW7O8CwzPQ',
        albumCover: 'https://img.youtube.com/vi/0yW7O8CwzPQ/maxresdefault.jpg',
        duration: 291,
        genres: ['Indonesian Pop', 'Alternative Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Topeng',
        artist: 'Peterpan',
        album: 'Bintang di Surga',
        youtubeId: 'DfK0J0Jy1Qk',
        albumCover: 'https://img.youtube.com/vi/DfK0J0Jy1Qk/maxresdefault.jpg',
        duration: 254,
        genres: ['Indonesian Pop', 'Alternative Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Bintang Kehidupan',
        artist: 'Nike Ardilla',
        album: 'Bintang Kehidupan',
        youtubeId: 'w1i58VrQgRQ',
        albumCover: 'https://img.youtube.com/vi/w1i58VrQgRQ/maxresdefault.jpg',
        duration: 290,
        genres: ['Indonesian Pop', 'Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Bento',
        artist: 'Iwan Fals',
        album: 'Swami',
        youtubeId: 'KZCRpJ3vXeM',
        albumCover: 'https://img.youtube.com/vi/KZCRpJ3vXeM/maxresdefault.jpg',
        duration: 260,
        genres: ['Indonesian Pop', 'Folk Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Pujaan Hati',
        artist: 'Kangen Band',
        album: 'Pujaan Hati',
        youtubeId: 'Qx7VnKLdGnM',
        albumCover: 'https://img.youtube.com/vi/Qx7VnKLdGnM/maxresdefault.jpg',
        duration: 258,
        genres: ['Indonesian Pop', 'Dangdut Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Hapus Aku',
        artist: 'Nidji',
        album: 'Dream Out Loud',
        youtubeId: 'Zy1mRCONbPk',
        albumCover: 'https://img.youtube.com/vi/Zy1mRCONbPk/maxresdefault.jpg',
        duration: 265,
        genres: ['Indonesian Pop', 'Alternative'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Harus Bahagia',
        artist: 'Armada',
        album: 'Harus Bahagia',
        youtubeId: 'rBxk91aRtPA',
        albumCover: 'https://img.youtube.com/vi/rBxk91aRtPA/maxresdefault.jpg',
        duration: 245,
        genres: ['Indonesian Pop', 'Pop Rock'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Surat Cinta untuk Starla',
        artist: 'Virgoun',
        album: 'Sings For Starla',
        youtubeId: 'K1yEwDaUxhA',
        albumCover: 'https://img.youtube.com/vi/K1yEwDaUxhA/maxresdefault.jpg',
        duration: 277,
        genres: ['Indonesian Pop', 'Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Sepatu',
        artist: 'Tulus',
        album: 'Gajah',
        youtubeId: 'Yh1eIw3sV0Y',
        albumCover: 'https://img.youtube.com/vi/Yh1eIw3sV0Y/maxresdefault.jpg',
        duration: 248,
        genres: ['Indonesian Pop', 'Jazz Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Monokrom',
        artist: 'Tulus',
        album: 'Monokrom',
        youtubeId: 'oY7rE3WOa0w',
        albumCover: 'https://img.youtube.com/vi/oY7rE3WOa0w/maxresdefault.jpg',
        duration: 285,
        genres: ['Indonesian Pop', 'Jazz Pop'],
      },
    }),
    prisma.song.create({
      data: {
        title: 'Kisah Inspiratif',
        artist: 'Armada',
        album: 'Satu Hati Sehingga Mati',
        youtubeId: 'a1z0JH1H0qQ',
        albumCover: 'https://img.youtube.com/vi/a1z0JH1H0qQ/maxresdefault.jpg',
        duration: 240,
        genres: ['Indonesian Pop', 'Pop Rock'],
      },
    }),
  ]);

  console.log(`✅ ${songs.length} songs created`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
