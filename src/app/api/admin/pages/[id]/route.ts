import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Page from '@/models/Page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: Props) {
  const { id } = await params;
  const conn = await connectDB();
  console.log('[GET page] Database:', conn.connection.name, 'Looking for ID:', id);
  const page = await Page.findById(id);
  if (!page) {
    console.log('[GET page] NOT FOUND. Checking DB...');
    const allPages = await Page.find({}).limit(5);
    console.log('[GET page] Pages in DB:', allPages.length, 'DB:', conn.connection.name);
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
  console.log('[GET page] found', page.slug, 'content length', page.content ? page.content.length : 0);
  return NextResponse.json(page);
}

export async function PUT(req: Request, { params }: Props) {
  const { id } = await params;
  await connectDB();
  const body = await req.json();
  console.log('[PUT page]', id, 'isPublished:', body.isPublished, 'content length:', body.content ? body.content.length : 0);
  const page = await Page.findByIdAndUpdate(id, body, { new: true });
  console.log('[PUT page] updated', page?.slug, 'content length', page?.content ? page.content.length : 0);

  // If published, ensure it's in main-menu
  try {
    if (page?.isPublished && page.slug) {
      const Menu = (await import('@/models/Menu')).default;
      const menu = await Menu.findOne({ handle: 'main-menu' });
      if (menu) {
        const exists = menu.items?.some((item: any) => item.type === 'page' && item.value === page.slug);
        if (!exists) {
          menu.items = menu.items || [];
          menu.items.push({ title: page.title || page.slug, type: 'page', value: page.slug });
          await menu.save();
          console.log('[Menu] added page to main-menu', page.slug);
        }
      }
    }
  } catch (err) {
    console.error('Menu update error:', err);
  }

  return NextResponse.json(page);
}

export async function DELETE(req: Request, { params }: Props) {
  const { id } = await params;
  await connectDB();
  console.log('[DELETE page] Attempting to delete:', id);
  const page = await Page.findByIdAndDelete(id);
  
  console.log('[DELETE page] Result:', page ? `Deleted: ${page.slug}` : 'Page not found');

  if (!page) {
    return NextResponse.json({ error: 'Page not found', deleted: false }, { status: 404 });
  }

  // Remove from main-menu if present
  try {
    if (page?.slug) {
      const Menu = (await import('@/models/Menu')).default;
      const menu = await Menu.findOne({ handle: 'main-menu' });
      if (menu?.items?.length) {
        const filtered = menu.items.filter((item: any) => !(item.type === 'page' && item.value === page.slug));
        if (filtered.length !== menu.items.length) {
          menu.items = filtered;
          await menu.save();
          console.log('[Menu] removed page from main-menu', page.slug);
        }
      }
    }
  } catch (err) {
    console.error('Menu cleanup error:', err);
  }

  return NextResponse.json({ success: true });
}