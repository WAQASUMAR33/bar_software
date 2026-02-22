-- ============================================================
-- Holiday Ice Cream POS - Seed Data
-- ============================================================

USE holiday_ice_cream_pos;

-- Default Admin User (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@holidayicecream.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Manager', 'manager@holidayicecream.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Cashier', 'cashier@holidayicecream.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cashier');

-- Categories
INSERT INTO categories (name, description) VALUES
('Ice Cream', 'All ice cream products including scoops, cones, and cups'),
('Milk Shakes', 'Thick and creamy milkshakes in various flavors'),
('Cold Drinks', 'Refreshing cold beverages and sodas'),
('Combos', 'Value combo deals and meal bundles');

-- Products - Ice Cream
INSERT INTO products (name, category_id, price, cost_price, stock, barcode, description) VALUES
('Vanilla Ice Cream Scoop', 1, 2.50, 1.00, 100, 'IC001', 'Classic vanilla single scoop'),
('Chocolate Ice Cream Scoop', 1, 2.50, 1.00, 100, 'IC002', 'Rich chocolate single scoop'),
('Strawberry Ice Cream Scoop', 1, 2.50, 1.00, 80, 'IC003', 'Fresh strawberry single scoop'),
('Mango Ice Cream Scoop', 1, 2.75, 1.10, 80, 'IC004', 'Tropical mango single scoop'),
('Double Scoop Cup', 1, 4.50, 1.80, 100, 'IC005', 'Any two flavors in a cup'),
('Triple Scoop Cup', 1, 6.00, 2.40, 100, 'IC006', 'Any three flavors in a cup'),
('Waffle Cone - Single', 1, 3.50, 1.40, 100, 'IC007', 'Single scoop in waffle cone'),
('Waffle Cone - Double', 1, 5.50, 2.20, 100, 'IC008', 'Double scoop in waffle cone'),
('Ice Cream Sundae', 1, 5.00, 2.00, 50, 'IC009', 'Sundae with toppings'),
('Banana Split', 1, 7.50, 3.00, 30, 'IC010', 'Classic banana split');

-- Products - Milk Shakes
INSERT INTO products (name, category_id, price, cost_price, stock, barcode, description) VALUES
('Vanilla Milkshake', 2, 4.50, 1.80, 50, 'MS001', 'Creamy vanilla milkshake'),
('Chocolate Milkshake', 2, 4.50, 1.80, 50, 'MS002', 'Rich chocolate milkshake'),
('Strawberry Milkshake', 2, 4.75, 1.90, 50, 'MS003', 'Fresh strawberry milkshake'),
('Mango Milkshake', 2, 5.00, 2.00, 40, 'MS004', 'Tropical mango milkshake'),
('Oreo Milkshake', 2, 5.50, 2.20, 40, 'MS005', 'Oreo cookies and cream milkshake'),
('Mixed Berry Milkshake', 2, 5.25, 2.10, 30, 'MS006', 'Mixed berry milkshake'),
('Caramel Milkshake', 2, 5.00, 2.00, 30, 'MS007', 'Caramel flavored milkshake');

-- Products - Cold Drinks
INSERT INTO products (name, category_id, price, cost_price, stock, barcode, description) VALUES
('Coca-Cola (330ml)', 3, 1.50, 0.60, 200, 'CD001', 'Chilled Coca-Cola can'),
('Pepsi (330ml)', 3, 1.50, 0.60, 200, 'CD002', 'Chilled Pepsi can'),
('Sprite (330ml)', 3, 1.50, 0.60, 150, 'CD003', 'Chilled Sprite can'),
('Fanta Orange (330ml)', 3, 1.50, 0.60, 150, 'CD004', 'Chilled Fanta Orange can'),
('Mineral Water (500ml)', 3, 1.00, 0.40, 300, 'CD005', 'Still mineral water'),
('Sparkling Water (330ml)', 3, 1.25, 0.50, 100, 'CD006', 'Sparkling mineral water'),
('Fresh Lemonade', 3, 3.00, 1.20, 50, 'CD007', 'Freshly squeezed lemonade'),
('Iced Tea', 3, 2.50, 1.00, 50, 'CD008', 'Chilled iced tea');

-- Combos
INSERT INTO products (name, category_id, price, cost_price, stock, barcode, description) VALUES
('Ice Cream + Drink Combo', 4, 5.50, 2.20, 50, 'CB001', 'Any single scoop + any cold drink'),
('Milkshake + Snack Combo', 4, 6.50, 2.60, 30, 'CB002', 'Any milkshake + snack item');

-- Product Variations
INSERT INTO product_variations (product_id, name, type, price_modifier) VALUES
(11, 'Small', 'size', -0.50),
(11, 'Medium', 'size', 0.00),
(11, 'Large', 'size', 1.00),
(12, 'Small', 'size', -0.50),
(12, 'Medium', 'size', 0.00),
(12, 'Large', 'size', 1.00);

-- Expense Categories
INSERT INTO expense_categories (name) VALUES
('Ingredients'),
('Utilities'),
('Staff Wages'),
('Rent'),
('Marketing'),
('Equipment'),
('Maintenance'),
('Miscellaneous');

-- Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('shop_name', 'Holiday Ice Cream Bar'),
('shop_address', '123 Ice Cream Street, Sweet City'),
('shop_phone', '+1-234-567-8900'),
('shop_email', 'info@holidayicecream.com'),
('tax_enabled', 'false'),
('tax_rate', '0'),
('currency', 'USD'),
('currency_symbol', '$'),
('receipt_footer', 'Thank you for visiting Holiday Ice Cream Bar!'),
('low_stock_alert', '10'),
('receipt_show_logo', 'true'),
('loyalty_points_enabled', 'false'),
('loyalty_points_ratio', '100');

-- Default Customers
INSERT INTO customers (name, phone, email) VALUES
('Walk-in Customer', '', '');

-- Default Suppliers
INSERT INTO suppliers (name, phone, email, address) VALUES
('Ice Cream Supplies Co.', '+1-800-ICE-1234', 'orders@icesupplies.com', '456 Supply Road, Cold Town'),
('Beverage Distributors Ltd.', '+1-800-BEV-5678', 'sales@bevdist.com', '789 Drink Lane, Thirst City');
