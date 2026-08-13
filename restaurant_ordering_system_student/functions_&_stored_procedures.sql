--
-- PostgreSQL database dump
--

\restrict 1PXvsARQSqvrhPpYg8EAJvuteDiPfc1t3GoBjXjwxTFCqSpuPSZtTHuHh42Qsmk

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-08-13 19:56:58

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 250 (class 1255 OID 25777)
-- Name: create_feedback(integer, integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_feedback(IN p_member_id integer, IN p_product_id integer, IN p_rating integer, IN p_comments character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN 
	-- validate product exists
	IF p_product_id IS NULL OR NOT EXISTS (
    SELECT 1
    FROM product
    WHERE product_id = p_product_id
) THEN
    RAISE EXCEPTION 'Product does not exist.';
END IF;
	-- validate rating
	IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    	RAISE EXCEPTION 'Rating must be between 1 and 5.';
	END IF;

	-- validate comments
	IF p_comments IS NULL OR TRIM(p_comments) = '' THEN
    	RAISE EXCEPTION 'Comments cannot be empty.';
	END IF;
	
	--join two tables and check if the member has bought the product he wants to review--
	IF NOT EXISTS (
        SELECT 1 
        FROM sale_order so
        JOIN sale_order_item soi
            ON so.order_id = soi.order_id
        WHERE so.member_id = p_member_id 
          AND so.status = 'COMPLETED'
          AND soi.product_id = p_product_id
    ) THEN 
        RAISE EXCEPTION 'You can provide feedback only on items you have bought.';
    END IF;

	--check if a member has already provided feedback on the product before--
	--if he has, then he can only update his existing feedback--
	--UNIQUE(member_id, product_id) blocks duplicate feedback but we want to provide our tailored error message--
    IF EXISTS (
        SELECT 1
        FROM dining_feedback
        WHERE member_id = p_member_id
          AND product_id = p_product_id
    ) THEN
        RAISE EXCEPTION 'You have already provided feedback for this item. Please update your existing feedback.';
    END IF;

    INSERT INTO dining_feedback(member_id, product_id, rating, comments)
    VALUES(p_member_id, p_product_id, p_rating, TRIM(p_comments));

END;
$$;


--
-- TOC entry 252 (class 1255 OID 25789)
-- Name: create_response(integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_response(IN p_feedback_id integer, IN p_member_id integer, IN p_response_comment character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_feedback_author_id INTEGER;
BEGIN
    -- Check feedback_id is not null
    IF p_feedback_id IS NULL THEN
        RAISE EXCEPTION 'Feedback ID is required.';
    END IF;

    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check response comment is not empty
    IF p_response_comment IS NULL OR TRIM(p_response_comment) = '' THEN
        RAISE EXCEPTION 'Response comment cannot be empty.';
    END IF;

    -- Check feedback exists
    IF NOT EXISTS (
        SELECT 1
        FROM dining_feedback df
        WHERE df.feedback_id = p_feedback_id
    ) THEN
        RAISE EXCEPTION 'Feedback not found.';
    END IF;

    -- Check member exists
    IF NOT EXISTS (
        SELECT 1
        FROM member m
        WHERE m.member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'Member not found.';
    END IF;

    -- Get feedback author
    SELECT df.member_id
    INTO v_feedback_author_id
    FROM dining_feedback df
    WHERE df.feedback_id = p_feedback_id;

    -- Check member is not responding to own feedback
    IF v_feedback_author_id = p_member_id THEN
        RAISE EXCEPTION 'You cannot respond to your own feedback.';
    END IF;

    -- Insert response
    INSERT INTO feedback_response(feedback_id, member_id, response_comment)
    VALUES(p_feedback_id, p_member_id, TRIM(p_response_comment));
END;
$$;


--
-- TOC entry 255 (class 1255 OID 25783)
-- Name: delete_feedback(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_feedback(IN p_member_id integer, IN p_feedback_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check feedback_id is not null
    IF p_feedback_id IS NULL THEN
        RAISE EXCEPTION 'Feedback ID is required.';
    END IF;
	
	--Check feedback exists
	IF NOT EXISTS(
	  SELECT 1
	  FROM dining_feedback
	  WHERE feedback_id = p_feedback_id
	) THEN 
		RAISE EXCEPTION 'Feedback not found.';
	END IF;

	--Check feedback belongs to this member
	IF NOT EXISTS (
		SELECT 1
		FROM dining_feedback
		WHERE feedback_id = p_feedback_id
		AND member_id = p_member_id
	) THEN
		RAISE EXCEPTION 'You can delete your own feedback only.';
	END IF;

	--delete feedback
	DELETE FROM dining_feedback
	WHERE feedback_id = p_feedback_id
	AND member_id = p_member_id;
END;
$$;


--
-- TOC entry 254 (class 1255 OID 25791)
-- Name: delete_response(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_response(IN p_member_id integer, IN p_response_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check response_id is not null
    IF p_response_id IS NULL THEN
        RAISE EXCEPTION 'Response ID is required.';
    END IF;

    -- Check response exists
    IF NOT EXISTS (
        SELECT 1
        FROM feedback_response fr
        WHERE fr.response_id = p_response_id
    ) THEN
        RAISE EXCEPTION 'Response not found.';
    END IF;

    -- Check response belongs to this member
    IF NOT EXISTS (
        SELECT 1
        FROM feedback_response fr
        WHERE fr.response_id = p_response_id
          AND fr.member_id = p_member_id
    ) THEN
        RAISE EXCEPTION 'You can delete only your own response.';
    END IF;

    -- Delete response
    DELETE FROM feedback_response
    WHERE response_id = p_response_id
      AND member_id = p_member_id;
END;
$$;


--
-- TOC entry 256 (class 1255 OID 25782)
-- Name: get_feedback(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feedback(p_member_id integer) RETURNS TABLE(feedback_id integer, product_name character varying, rating integer, comments character varying, updated_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN 
-- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;
	
	RETURN QUERY 
	SELECT df.feedback_id, p.name, df.rating, df.comments, df.updated_at
	FROM dining_feedback df
	JOIN product p
	ON df.product_id = p.product_id
	WHERE df.member_id = p_member_id;
END;
$$;


--
-- TOC entry 253 (class 1255 OID 25788)
-- Name: get_feedback_by_product(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feedback_by_product(p_product_id integer, p_logged_in_member_id integer) RETURNS TABLE(feedback_id integer, member_id integer, member_name text, rating integer, comments character varying, last_updated timestamp without time zone, can_respond boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Check product exists
    IF p_product_id IS NULL OR NOT EXISTS (
        SELECT 1
        FROM product p
        WHERE p.product_id = p_product_id
    ) THEN
        RAISE EXCEPTION 'Product not found.';
    END IF;
	
	-- Check logged-in member_id is not null
    IF p_logged_in_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;
	
	RETURN QUERY
	SELECT df.feedback_id, m.member_id,  CONCAT(m.first_name, ' ', m.last_name) AS member_name, df.rating, df.comments, df.updated_at AS last_updated, df.member_id <> p_logged_in_member_id AS can_respond
	FROM dining_feedback df
	JOIN member m
	ON df.member_id = m.member_id
	WHERE df.product_id = p_product_id
	ORDER BY updated_at DESC;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 25790)
-- Name: get_responses_by_feedback(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_responses_by_feedback(p_feedback_id integer, p_member_id integer) RETURNS TABLE(response_id integer, feedback_id integer, member_id integer, member_name text, response_comment character varying, created_at timestamp without time zone, can_delete boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
	-- Check feedback_id is not null
    IF p_feedback_id IS NULL THEN
        RAISE EXCEPTION 'Feedback ID is required.';
    END IF;

    -- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;
	
    -- Check feedback exists
    IF NOT EXISTS (
        SELECT 1
        FROM dining_feedback df
        WHERE df.feedback_id = p_feedback_id
    ) THEN
        RAISE EXCEPTION 'Feedback not found.';
    END IF;

    RETURN QUERY
    SELECT
        fr.response_id,
        fr.feedback_id,
        fr.member_id,
        CONCAT(m.first_name, ' ', m.last_name) AS member_name,
        fr.response_comment,
        fr.created_at,
		fr.member_id = p_member_id AS can_delete
    FROM feedback_response fr
    JOIN member m
        ON fr.member_id = m.member_id
    WHERE fr.feedback_id = p_feedback_id
    ORDER BY fr.created_at ASC;
END;
$$;


--
-- TOC entry 258 (class 1255 OID 25779)
-- Name: get_sale_order_summary(integer, date, date, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sale_order_summary(p_admin_member_id integer, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_category text DEFAULT NULL::text, p_sort_by text DEFAULT 'order_date'::text, p_sort_order text DEFAULT 'DESC'::text) RETURNS TABLE(order_id integer, customer_name text, order_date timestamp without time zone, total_amount numeric, status text, product_count integer, products_ordered text)
    LANGUAGE plpgsql
    AS $_$
DECLARE
    query TEXT;
BEGIN
	-- Set default sort values if NULL is passed
    p_sort_by := COALESCE(p_sort_by, 'order_date');
    p_sort_order := COALESCE(p_sort_order, 'DESC');
	
    -- Check admin access
    IF NOT EXISTS (
        SELECT 1
        FROM member_role mr
        WHERE mr.member_id = p_admin_member_id
        AND mr.role = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Access denied. Only admins can access the dashboard.';
    END IF;

    -- Validate start and end date
    IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
        IF p_end_date < p_start_date THEN
            RAISE EXCEPTION 'End date cannot be earlier than start date';
        END IF;
    END IF;

    -- Validate sort_by field
    IF LOWER(p_sort_by) NOT IN (
        'order_date', 
        'total_amount',
        'customer_name', 
        'status'
    ) THEN
        RAISE EXCEPTION 'Invalid sort field: %', p_sort_by;
    END IF;

    -- Validate sort order
    IF LOWER(p_sort_order) NOT IN ('ascending', 'descending', 'asc', 'desc') THEN
        RAISE EXCEPTION 'Invalid sort order: %', p_sort_order;
    END IF;

    -- Convert sort order to SQL standard
    p_sort_order := CASE 
        WHEN LOWER(p_sort_order) = 'ascending' THEN 'ASC' 
        WHEN LOWER(p_sort_order) = 'descending' THEN 'DESC'
        ELSE UPPER(p_sort_order)
    END;

    -- Build main query
    query := '
        SELECT
            so.order_id::INT AS order_id,
            CONCAT(m.first_name, '' '', m.last_name)::TEXT AS customer_name,
            so.order_date::TIMESTAMP AS order_date,
            so.total_amount::NUMERIC AS total_amount,
            so.status::TEXT AS status,
            SUM(soi.quantity)::INT AS product_count,
            STRING_AGG(p.name, '', '')::TEXT AS products_ordered
        FROM sale_order so
        JOIN member m
            ON so.member_id = m.member_id
        JOIN sale_order_item soi
            ON so.order_id = soi.order_id
        JOIN product p
            ON soi.product_id = p.product_id
        WHERE
            ($1 IS NULL OR so.order_date::DATE >= $1)
            AND ($2 IS NULL OR so.order_date::DATE <= $2)
            AND ($3 IS NULL OR $3 = '''' OR p.category = $3)
        GROUP BY
            so.order_id,
            m.first_name,
            m.last_name,
            so.order_date,
            so.total_amount,
            so.status
    ';

    -- Add dynamic ORDER BY
    query := query || ' ORDER BY ' || quote_ident(LOWER(p_sort_by)) || ' ' || UPPER(p_sort_order);

    -- Execute query with filter parameters
    RETURN QUERY EXECUTE query
    USING p_start_date, p_end_date, p_category;

END;
$_$;


--
-- TOC entry 259 (class 1255 OID 42758)
-- Name: place_orders(integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_orders(IN p_member_id integer, IN p_delivery_address text, OUT p_order_id integer, OUT p_items_processed integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cart_id INT;
    v_item RECORD;
    v_unit_price DECIMAL(10,2);
    v_subtotal DECIMAL(10,2);
BEGIN
	--initialise the output values
    p_items_processed := 0;
    p_order_id := NULL;
	--find the member's cart
    SELECT cart_id INTO v_cart_id FROM cart WHERE member_id = p_member_id;
    --if the member has no cart, exit
    IF v_cart_id IS NULL THEN
        RETURN;
    END IF;
	--create the sale_order but do not commit yet
	--outer transaction that stays uncommitted until the final COMMIT at the end of the procedure
    INSERT INTO sale_order (member_id, order_date, total_amount, status, delivery_address)
    VALUES (p_member_id, NOW(), 0, 'PACKING', p_delivery_address)
    RETURNING order_id INTO p_order_id;
	--loop through every cart item
	--for each item, join with its current product info(price,availability)
    FOR v_item IN
        SELECT ci.cart_item_id, ci.product_id, ci.quantity, p.price, p.is_available
        FROM cart_item ci
        JOIN product p ON ci.product_id = p.product_id
        WHERE ci.cart_id = v_cart_id
    LOOP
		--check availability, if false skip the whole BEGIN ... END block
        IF v_item.is_available THEN
            -- This nested BEGIN...EXCEPTION...END block = the savepoint
            -- boundary If anything inside it fails, 
            -- automatically rolls back just this block's changes - no
            -- explicit SAVEPOINT/ROLLBACK TO is needed.
            BEGIN
			    --if available = true, 
                v_unit_price := v_item.price;
                v_subtotal := v_unit_price * v_item.quantity;
				--sale_order_item inserted
                INSERT INTO sale_order_item (order_id, product_id, quantity, unit_price, subtotal)
                VALUES (p_order_id, v_item.product_id, v_item.quantity, v_unit_price, v_subtotal);
				--sale_order.total_amount incremented by this item's subtotal
                UPDATE sale_order
                SET total_amount = total_amount + v_subtotal
                WHERE order_id = p_order_id;
				--removed from cart_item
                DELETE FROM cart_item WHERE cart_item_id = v_item.cart_item_id;
				--p_items_processed incremented 
                p_items_processed := p_items_processed + 1;
            --if something unexpected fails, undo everything inside the nested BEGIN
			--(undo failed item's insert/update/delete)
			--but the earlier items in the loop that finish their own BEGIN...END block remains intact
			--each iteration gets its own nested block, independent of others
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipped cart_item % due to error: %', v_item.cart_item_id, SQLERRM;
            END;
        END IF;
    END LOOP;
	--check if anything was actually processed
	--if zero items succeed, delete the sale_order row
    IF p_items_processed = 0 THEN
        DELETE FROM sale_order WHERE order_id = p_order_id;
        p_order_id := NULL;
    END IF;
    COMMIT;
END;
$$;


--
-- TOC entry 251 (class 1255 OID 25784)
-- Name: update_feedback(integer, integer, integer, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_feedback(IN p_member_id integer, IN p_feedback_id integer, IN p_rating integer, IN p_comments character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
-- Check member_id is not null
    IF p_member_id IS NULL THEN
        RAISE EXCEPTION 'Member ID is required.';
    END IF;

    -- Check feedback_id is not null
    IF p_feedback_id IS NULL THEN
        RAISE EXCEPTION 'Feedback ID is required.';
    END IF;

 --Check feedback exists
	IF NOT EXISTS(
	  SELECT 1
	  FROM dining_feedback
	  WHERE feedback_id = p_feedback_id
	) THEN 
		RAISE EXCEPTION 'Feedback not found.';
	END IF;

--Check feedback belongs to this member
	IF NOT EXISTS (
		SELECT 1
		FROM dining_feedback
		WHERE feedback_id = p_feedback_id
		AND member_id = p_member_id
	) THEN
		RAISE EXCEPTION 'You can update your own feedback only.';
	END IF;

-- validate rating
	IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 THEN
    	RAISE EXCEPTION 'Rating must be between 1 and 5.';
	END IF;

	-- validate comments
	IF p_comments IS NULL OR TRIM(p_comments) = '' THEN
    	RAISE EXCEPTION 'Comments cannot be empty.';
	END IF;

	UPDATE dining_feedback 
	SET rating = p_rating, 
	comments = p_comments,
	updated_at = CURRENT_TIMESTAMP
	WHERE member_id = p_member_id
	AND feedback_id = p_feedback_id;
END;
$$;


--
-- TOC entry 232 (class 1259 OID 41017)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 42135)
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    cart_id integer NOT NULL,
    member_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- TOC entry 233 (class 1259 OID 42134)
-- Name: cart_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 233
-- Name: cart_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_cart_id_seq OWNED BY public.cart.cart_id;


--
-- TOC entry 236 (class 1259 OID 42146)
-- Name: cart_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_item (
    cart_item_id integer NOT NULL,
    cart_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone
);


--
-- TOC entry 235 (class 1259 OID 42145)
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_item_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 235
-- Name: cart_item_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_item_cart_item_id_seq OWNED BY public.cart_item.cart_item_id;


--
-- TOC entry 229 (class 1259 OID 25726)
-- Name: dining_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dining_feedback (
    feedback_id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    rating integer NOT NULL,
    comments character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_dining_feedback_comments CHECK ((TRIM(BOTH FROM comments) <> ''::text)),
    CONSTRAINT chk_dining_feedback_rating CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 228 (class 1259 OID 25725)
-- Name: dining_feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.dining_feedback ALTER COLUMN feedback_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.dining_feedback_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 238 (class 1259 OID 42530)
-- Name: discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount (
    discount_id integer NOT NULL,
    discount_name character varying(100) NOT NULL,
    discount_type character varying(30) NOT NULL,
    product_id integer,
    min_quantity integer,
    min_cart_value numeric(10,2),
    max_cart_value numeric(10,2),
    applies_to character varying(20) NOT NULL,
    discount_percent numeric(5,2),
    discount_amount numeric(10,2),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 237 (class 1259 OID 42529)
-- Name: discount_discount_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.discount_discount_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 237
-- Name: discount_discount_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.discount_discount_id_seq OWNED BY public.discount.discount_id;


--
-- TOC entry 231 (class 1259 OID 25753)
-- Name: feedback_response; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_response (
    response_id integer NOT NULL,
    feedback_id integer NOT NULL,
    member_id integer NOT NULL,
    response_comment character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_response_comment CHECK ((TRIM(BOTH FROM response_comment) <> ''::text))
);


--
-- TOC entry 230 (class 1259 OID 25752)
-- Name: feedback_response_response_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.feedback_response ALTER COLUMN response_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.feedback_response_response_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 219 (class 1259 OID 25575)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    member_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 25587)
-- Name: member_member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_member_id_seq OWNED BY public.member.member_id;


--
-- TOC entry 221 (class 1259 OID 25588)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    member_id integer NOT NULL,
    role character varying(20) NOT NULL,
    CONSTRAINT member_role_role_check CHECK (((role)::text = ANY (ARRAY[('ADMIN'::character varying)::text, ('USER'::character varying)::text])))
);


--
-- TOC entry 222 (class 1259 OID 25594)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    product_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    category character varying(50),
    is_available boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 25604)
-- Name: product_product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 223
-- Name: product_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_product_id_seq OWNED BY public.product.product_id;


--
-- TOC entry 224 (class 1259 OID 25605)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    order_id integer NOT NULL,
    member_id integer,
    order_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) NOT NULL,
    delivery_address text,
    CONSTRAINT sale_order_status_check CHECK (((status)::text = ANY (ARRAY[('COMPLETED'::character varying)::text, ('CANCELLED'::character varying)::text, ('PACKING'::character varying)::text])))
);


--
-- TOC entry 225 (class 1259 OID 25615)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    order_item_id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    CONSTRAINT sale_order_item_quantity_check CHECK ((quantity > 0))
);


--
-- TOC entry 226 (class 1259 OID 25623)
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 226
-- Name: sale_order_item_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_order_item_id_seq OWNED BY public.sale_order_item.order_item_id;


--
-- TOC entry 227 (class 1259 OID 25624)
-- Name: sale_order_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 227
-- Name: sale_order_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_order_id_seq OWNED BY public.sale_order.order_id;


--
-- TOC entry 4927 (class 2604 OID 42138)
-- Name: cart cart_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart ALTER COLUMN cart_id SET DEFAULT nextval('public.cart_cart_id_seq'::regclass);


--
-- TOC entry 4929 (class 2604 OID 42149)
-- Name: cart_item cart_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_item_cart_item_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 42533)
-- Name: discount discount_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount ALTER COLUMN discount_id SET DEFAULT nextval('public.discount_discount_id_seq'::regclass);


--
-- TOC entry 4914 (class 2604 OID 25625)
-- Name: member member_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN member_id SET DEFAULT nextval('public.member_member_id_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 25626)
-- Name: product product_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN product_id SET DEFAULT nextval('public.product_product_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 25627)
-- Name: sale_order order_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN order_id SET DEFAULT nextval('public.sale_order_order_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 25628)
-- Name: sale_order_item order_item_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN order_item_id SET DEFAULT nextval('public.sale_order_item_order_item_id_seq'::regclass);


--
-- TOC entry 4961 (class 2606 OID 41030)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 42157)
-- Name: cart_item cart_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT cart_item_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 4964 (class 2606 OID 42144)
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (cart_id);


--
-- TOC entry 4969 (class 2606 OID 42543)
-- Name: discount discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT discount_pkey PRIMARY KEY (discount_id);


--
-- TOC entry 4941 (class 2606 OID 25630)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4943 (class 2606 OID 25632)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (member_id);


--
-- TOC entry 4947 (class 2606 OID 25634)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (member_id, role);


--
-- TOC entry 4945 (class 2606 OID 25636)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4955 (class 2606 OID 25741)
-- Name: dining_feedback pk_dining_feedback; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT pk_dining_feedback PRIMARY KEY (feedback_id);


--
-- TOC entry 4959 (class 2606 OID 25766)
-- Name: feedback_response pk_response; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT pk_response PRIMARY KEY (response_id);


--
-- TOC entry 4949 (class 2606 OID 25638)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (product_id);


--
-- TOC entry 4953 (class 2606 OID 25640)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 4951 (class 2606 OID 25642)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4957 (class 2606 OID 25794)
-- Name: dining_feedback uq_dining_feedback_member_product; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT uq_dining_feedback_member_product UNIQUE (member_id, product_id);


--
-- TOC entry 4962 (class 1259 OID 42158)
-- Name: cart_member_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cart_member_id_key ON public.cart USING btree (member_id);


--
-- TOC entry 4967 (class 1259 OID 42159)
-- Name: uq_cart_item_cart_product; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_cart_item_cart_product ON public.cart_item USING btree (cart_id, product_id);


--
-- TOC entry 4979 (class 2606 OID 42165)
-- Name: cart_item fk_cart_item_cart; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT fk_cart_item_cart FOREIGN KEY (cart_id) REFERENCES public.cart(cart_id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 42170)
-- Name: cart_item fk_cart_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_item
    ADD CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4978 (class 2606 OID 42160)
-- Name: cart fk_cart_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT fk_cart_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4974 (class 2606 OID 25742)
-- Name: dining_feedback fk_dining_feedback_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT fk_dining_feedback_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4975 (class 2606 OID 25747)
-- Name: dining_feedback fk_dining_feedback_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dining_feedback
    ADD CONSTRAINT fk_dining_feedback_product FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4981 (class 2606 OID 42544)
-- Name: discount fk_discount_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount
    ADD CONSTRAINT fk_discount_product FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4976 (class 2606 OID 25767)
-- Name: feedback_response fk_response_feedback; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT fk_response_feedback FOREIGN KEY (feedback_id) REFERENCES public.dining_feedback(feedback_id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 25772)
-- Name: feedback_response fk_response_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response
    ADD CONSTRAINT fk_response_member FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4970 (class 2606 OID 25643)
-- Name: member_role member_role_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


--
-- TOC entry 4972 (class 2606 OID 25648)
-- Name: sale_order_item sale_order_item_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.sale_order(order_id);


--
-- TOC entry 4973 (class 2606 OID 25653)
-- Name: sale_order_item sale_order_item_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(product_id);


--
-- TOC entry 4971 (class 2606 OID 25658)
-- Name: sale_order sale_order_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(member_id);


-- Completed on 2026-08-13 19:56:58

--
-- PostgreSQL database dump complete
--

\unrestrict 1PXvsARQSqvrhPpYg8EAJvuteDiPfc1t3GoBjXjwxTFCqSpuPSZtTHuHh42Qsmk

