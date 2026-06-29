import { Link } from 'react-router-dom';

export default function Checkout() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Link to="/" className="text-2xl font-bold text-brand-600">ChopHub</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">Checkout</h1>
        <p className="text-gray-600 mb-8">Order placement + Monnify payment integration lands in the next iteration.</p>
        <Link to="/cart" className="text-brand-600 font-semibold">← Back to cart</Link>
      </div>
    </div>
  );
}
